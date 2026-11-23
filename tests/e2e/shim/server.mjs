// ════════════════════════════════════════════════════════════════════
//  TEST-ONLY local Supabase gateway.
//
//  Emulates the subset of the Supabase HTTP APIs this app uses —
//  PostgREST (/rest/v1), GoTrue (/auth/v1) and Storage (/storage/v1) —
//  on top of a REAL PostgreSQL database running our real migrations.
//  Every request runs inside a transaction as the Postgres role named in
//  the caller's JWT (anon / authenticated) with request.jwt.claims set, so
//  Row Level Security policies are enforced by Postgres exactly as they
//  would be on Supabase.
//
//  Never used in production. See scripts/e2e.sh.
// ════════════════════════════════════════════════════════════════════
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const PORT = Number(process.env.SHIM_PORT ?? 54321);
const JWT_SECRET = process.env.SHIM_JWT_SECRET ?? "test-only-secret-at-least-32-characters-long";
const STORAGE_DIR = process.env.SHIM_STORAGE_DIR ?? "/tmp/poojavi-shim-storage";
const pool = new pg.Pool({ connectionString: process.env.SHIM_DATABASE_URL, max: 10 });
fs.mkdirSync(STORAGE_DIR, { recursive: true });

// ─── JWT (HS256) ──────────────────────────────────────────────────────
const b64u = (buf) => Buffer.from(buf).toString("base64url");
export function signJwt(payload) {
  const header = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64u(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}
function verifyJwt(token) {
  const [h, b, s] = String(token ?? "").split(".");
  if (!h || !b || !s) return null;
  const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${h}.${b}`).digest("base64url");
  if (s.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
  const claims = JSON.parse(Buffer.from(b, "base64url").toString());
  if (claims.exp && claims.exp * 1000 < Date.now()) return null;
  return claims;
}
function claimsFrom(req) {
  const auth = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const claims = verifyJwt(auth) ?? verifyJwt(req.headers.apikey);
  if (!claims) return { role: "anon" };
  return claims;
}

// ─── Schema introspection (FKs + function signatures) ─────────────────
let fks = [];
let functions = new Map();
async function introspect() {
  const fk = await pool.query(`
    select c.conrelid::regclass::text as from_table, a.attname as from_col,
           c.confrelid::regclass::text as to_table, af.attname as to_col
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    join pg_attribute af on af.attrelid = c.confrelid and af.attnum = c.confkey[1]
    where c.contype = 'f' and c.connamespace = 'public'::regnamespace`);
  fks = fk.rows.map((r) => ({ ...r, from_table: r.from_table.replace(/^public\./, ""), to_table: r.to_table.replace(/^public\./, "") }));
  const fn = await pool.query(`
    select p.proname, p.proretset, p.prorettype::regtype::text as rettype,
           coalesce(p.proargnames, '{}') as argnames,
           array(select format_type(t, null) from unnest(p.proargtypes) t) as argtypes
    from pg_proc p where p.pronamespace = 'public'::regnamespace`);
  functions = new Map(fn.rows.map((r) => [r.proname, r]));
}

// ─── Helpers ──────────────────────────────────────────────────────────
const ident = (s) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(s)) throw new HttpError(400, { code: "PGRST100", message: `invalid identifier ${s}` });
  return `"${s}"`;
};
class HttpError extends Error {
  constructor(status, body) {
    super(body.message);
    this.status = status;
    this.body = body;
  }
}
function splitTop(str, sep = ",") {
  const out = [];
  let depth = 0;
  let cur = "";
  let quoted = false;
  for (const ch of str) {
    if (ch === '"') quoted = !quoted;
    if (!quoted && ch === "(") depth++;
    if (!quoted && ch === ")") depth--;
    if (!quoted && depth === 0 && ch === sep) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

function parseSelect(str) {
  return splitTop(str || "*").map((item) => {
    const m = item.match(/^(?:([\w]+):)?([\w]+)(?:!([\w]+))?\(([\s\S]*)\)$/);
    if (m) {
      const [, alias, relation, hint, inner] = m;
      if (inner.trim() === "count") return { type: "count", alias: alias ?? relation, relation };
      return { type: "embed", alias: alias ?? relation, relation, inner: hint === "inner", children: parseSelect(inner) };
    }
    if (item === "*") return { type: "star" };
    const c = item.match(/^(?:([\w]+):)?([\w]+)(?:::\w+)?$/);
    if (!c) throw new HttpError(400, { code: "PGRST100", message: `unsupported select item ${item}` });
    return { type: "col", alias: c[1] ?? c[2], name: c[2] };
  });
}

function relationBetween(parent, child) {
  const m2o = fks.find((f) => f.from_table === parent && f.to_table === child);
  if (m2o) return { kind: "m2o", cond: (pa, ca) => `${ca}.${ident(m2o.to_col)} = ${pa}.${ident(m2o.from_col)}` };
  const o2m = fks.find((f) => f.from_table === child && f.to_table === parent);
  if (o2m) return { kind: "o2m", cond: (pa, ca) => `${ca}.${ident(o2m.from_col)} = ${pa}.${ident(o2m.to_col)}` };
  throw new HttpError(400, { code: "PGRST200", message: `Could not find a relationship between '${parent}' and '${child}'` });
}

// ─── Filters ──────────────────────────────────────────────────────────
function parseValueList(v) {
  return splitTop(v.replace(/^\(|\)$/g, "")).map((x) => x.replace(/^"|"$/g, ""));
}
function opSql(col, opExpr, params) {
  let negate = false;
  let expr = opExpr;
  if (expr.startsWith("not.")) {
    negate = true;
    expr = expr.slice(4);
  }
  const dot = expr.indexOf(".");
  const op = expr.slice(0, dot);
  const val = expr.slice(dot + 1);
  const p = (v) => {
    params.push(v);
    return `$${params.length}`;
  };
  let sql;
  switch (op) {
    case "eq": sql = `${col} = ${p(val)}`; break;
    case "neq": sql = `${col} <> ${p(val)}`; break;
    case "gt": sql = `${col} > ${p(val)}`; break;
    case "gte": sql = `${col} >= ${p(val)}`; break;
    case "lt": sql = `${col} < ${p(val)}`; break;
    case "lte": sql = `${col} <= ${p(val)}`; break;
    case "like": sql = `${col}::text like ${p(val.replace(/\*/g, "%"))}`; break;
    case "ilike": sql = `${col}::text ilike ${p(val.replace(/\*/g, "%"))}`; break;
    case "in": sql = `${col}::text = any(${p(parseValueList(val))}::text[])`; break;
    case "is": sql = `${col} is ${val === "null" ? "null" : val === "true" ? "true" : val === "false" ? "false" : "unknown"}`; break;
    default: throw new HttpError(400, { code: "PGRST100", message: `unsupported operator ${op}` });
  }
  return negate ? `not (${sql})` : sql;
}
function orSql(alias, value, params) {
  const parts = splitTop(value.replace(/^\(|\)$/g, ""));
  return `(${parts
    .map((part) => {
      const d = part.indexOf(".");
      return opSql(`${alias}.${ident(part.slice(0, d))}`, part.slice(d + 1), params);
    })
    .join(" or ")})`;
}

const RESERVED = new Set(["select", "order", "limit", "offset", "columns", "on_conflict"]);
function collectFilters(searchParams) {
  const top = [];
  const embedded = new Map(); // alias -> [[col, expr]]
  const orders = [];
  for (const [key, value] of searchParams) {
    if (RESERVED.has(key)) continue;
    if (key === "or") {
      top.push({ or: value });
      continue;
    }
    const m = key.match(/^([\w]+)\.([\w]+)$/);
    if (m) {
      if (m[2] === "order") continue; // embedded ordering: not needed by the app
      if (!embedded.has(m[1])) embedded.set(m[1], []);
      embedded.get(m[1]).push([m[2], value]);
    } else top.push({ col: key, expr: value });
  }
  const order = searchParams.get("order");
  if (order) {
    for (const part of splitTop(order)) {
      const [col, ...mods] = part.split(".");
      orders.push(`${ident(col)}${mods.includes("desc") ? " desc" : mods.includes("asc") ? " asc" : ""}${mods.includes("nullslast") ? " nulls last" : mods.includes("nullsfirst") ? " nulls first" : ""}`);
    }
  }
  return { top, embedded, orders };
}

// ─── SELECT builder ───────────────────────────────────────────────────
let aliasSeq = 0;
function buildProjection(table, alias, nodes, embedded, params, where) {
  const cols = [];
  for (const n of nodes) {
    if (n.type === "star") cols.push(`${alias}.*`);
    else if (n.type === "col") cols.push(`${alias}.${ident(n.name)} as ${ident(n.alias)}`);
    else if (n.type === "count") {
      const rel = relationBetween(table, n.relation);
      const ca = `t${++aliasSeq}`;
      cols.push(`(select json_build_array(json_build_object('count', count(*))) from public.${ident(n.relation)} ${ca} where ${rel.cond(alias, ca)}) as ${ident(n.alias)}`);
    } else if (n.type === "embed") {
      const rel = relationBetween(table, n.relation);
      const ca = `t${++aliasSeq}`;
      const conds = [rel.cond(alias, ca)];
      for (const [col, expr] of embedded.get(n.alias) ?? embedded.get(n.relation) ?? []) conds.push(opSql(`${ca}.${ident(col)}`, expr, params));
      const inner = buildProjection(n.relation, ca, n.children, new Map(), params, []);
      const sub = `select ${inner} from public.${ident(n.relation)} ${ca} where ${conds.join(" and ")}`;
      if (rel.kind === "m2o") cols.push(`(select row_to_json(x) from (${sub} limit 1) x) as ${ident(n.alias)}`);
      else cols.push(`coalesce((select json_agg(x) from (${sub}) x), '[]'::json) as ${ident(n.alias)}`);
      if (n.inner) where.push(`exists (select 1 from public.${ident(n.relation)} ${ca}e where ${conds.join(" and ").replaceAll(`${ca}.`, `${ca}e.`)})`);
    }
  }
  return cols.join(", ") || `${alias}.*`;
}

async function withRole(claims, fn) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const role = claims.role === "authenticated" ? "authenticated" : claims.role === "service_role" ? "service_role" : "anon";
    await client.query(`set local role ${role}`);
    await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

function pgError(err, claims) {
  if (err instanceof HttpError) return err;
  const status =
    err.code === "42501" ? (claims.role === "anon" ? 401 : 403) : err.code === "23505" || err.code === "23503" ? 409 : err.code === "P0002" ? 404 : 400;
  return new HttpError(status, { code: err.code ?? "", message: err.message, details: err.detail ?? null, hint: err.hint ?? null });
}

// ─── PostgREST handler ────────────────────────────────────────────────
async function handleRest(req, res, url, body) {
  const claims = claimsFrom(req);
  const rel = url.pathname.replace(/^\/rest\/v1\//, "");
  const prefer = req.headers.prefer ?? "";
  const wantsCount = /count=exact/.test(prefer);
  const wantsRepr = /return=representation/.test(prefer);
  const accept = req.headers.accept ?? "";
  const singleObject = accept.includes("vnd.pgrst.object");

  try {
    if (rel.startsWith("rpc/")) return await handleRpc(rel.slice(4), claims, body, res, singleObject);
    const table = rel;
    ident(table);
    const params = [];
    const { top, embedded, orders } = collectFilters(url.searchParams);
    const alias = "t0";
    aliasSeq = 0;
    const where = [];
    for (const f of top) where.push(f.or ? orSql(alias, f.or, params) : opSql(`${alias}.${ident(f.col)}`, f.expr, params));

    const result = await withRole(claims, async (db) => {
      if (req.method === "GET" || req.method === "HEAD") {
        const nodes = parseSelect(url.searchParams.get("select") ?? "*");
        const projection = buildProjection(table, alias, nodes, embedded, params, where);
        const whereSql = where.length ? `where ${where.join(" and ")}` : "";
        const orderSql = orders.length ? `order by ${orders.map((o) => `${alias}.${o}`).join(", ")}` : "";
        const limit = url.searchParams.get("limit");
        const offset = url.searchParams.get("offset");
        const limitSql = `${limit ? `limit ${Number(limit)}` : ""} ${offset ? `offset ${Number(offset)}` : ""}`;
        let total = null;
        if (wantsCount) total = Number((await db.query(`select count(*) from public.${ident(table)} ${alias} ${whereSql}`, params)).rows[0].count);
        const rows =
          req.method === "HEAD"
            ? []
            : (await db.query(`select coalesce(json_agg(r), '[]'::json) as data from (select ${projection} from public.${ident(table)} ${alias} ${whereSql} ${orderSql} ${limitSql}) r`, params)).rows[0].data;
        return { rows, total };
      }
      if (req.method === "POST") {
        const items = Array.isArray(body) ? body : [body];
        const out = [];
        for (const item of items) {
          const keys = Object.keys(item);
          const cols = keys.map(ident).join(", ");
          const q = `insert into public.${ident(table)} (${cols}) select ${cols} from json_populate_record(null::public.${ident(table)}, $1::json) ${wantsRepr ? "returning *" : ""}`;
          const r = await db.query(q, [JSON.stringify(item)]);
          out.push(...r.rows);
        }
        return { rows: out, total: out.length };
      }
      if (req.method === "PATCH") {
        const keys = Object.keys(body);
        params.push(JSON.stringify(body));
        const sets = keys.map((k) => `${ident(k)} = r.${ident(k)}`).join(", ");
        const q = `with u as (update public.${ident(table)} ${alias} set ${sets} from json_populate_record(null::public.${ident(table)}, $${params.length}::json) r ${where.length ? `where ${where.join(" and ")}` : ""} returning ${alias}.*) select coalesce(json_agg(u), '[]'::json) as data, count(*) as n from u`;
        const r = await db.query(q, params);
        return { rows: r.rows[0].data, total: Number(r.rows[0].n) };
      }
      if (req.method === "DELETE") {
        const q = `with d as (delete from public.${ident(table)} ${alias} ${where.length ? `where ${where.join(" and ")}` : ""} returning ${alias}.*) select coalesce(json_agg(d), '[]'::json) as data, count(*) as n from d`;
        const r = await db.query(q, params);
        return { rows: r.rows[0].data, total: Number(r.rows[0].n) };
      }
      throw new HttpError(405, { code: "", message: "method not allowed" });
    });

    const headers = { "Content-Type": "application/json" };
    if (wantsCount || req.method === "HEAD") {
      const n = result.rows.length;
      headers["Content-Range"] = `${n ? `0-${n - 1}` : "*"}/${result.total ?? n}`;
    }
    if (req.method === "HEAD") return send(res, 200, null, headers);
    if ((req.method === "POST" || req.method === "PATCH" || req.method === "DELETE") && !wantsRepr) return send(res, req.method === "POST" ? 201 : 204, null, headers);
    let rows = result.rows;
    if (wantsRepr && req.method !== "GET") {
      const sel = url.searchParams.get("select");
      if (sel && sel !== "*") {
        const cols = parseSelect(sel).filter((n) => n.type === "col");
        rows = rows.map((row) => Object.fromEntries(cols.map((c) => [c.alias, row[c.name]])));
      }
    }
    if (singleObject) {
      if (rows.length !== 1) return send(res, 406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: `The result contains ${rows.length} rows`, hint: null });
      return send(res, req.method === "POST" ? 201 : 200, rows[0], headers);
    }
    return send(res, req.method === "POST" ? 201 : 200, rows, headers);
  } catch (err) {
    const e = pgError(err, claims);
    return send(res, e.status, e.body);
  }
}

async function handleRpc(name, claims, args, res, singleObject) {
  const fn = functions.get(name);
  if (!fn) throw new HttpError(404, { code: "PGRST202", message: `Could not find the function public.${name}` });
  const params = [];
  const argSql = Object.entries(args ?? {}).map(([k, v]) => {
    const i = fn.argnames.indexOf(k);
    if (i < 0) throw new HttpError(400, { code: "PGRST202", message: `unknown argument ${k}` });
    const type = fn.argtypes[i];
    params.push(type === "jsonb" || type === "json" ? JSON.stringify(v) : v);
    return `${ident(k)} => $${params.length}::${type}`;
  });
  const call = `public.${ident(name)}(${argSql.join(", ")})`;
  try {
    const out = await withRole(claims, async (db) => {
      if (fn.proretset) return (await db.query(`select coalesce(json_agg(r), '[]'::json) as data from ${call} r`, params)).rows[0].data;
      if (fn.rettype === "void") {
        await db.query(`select ${call}`, params);
        return undefined;
      }
      return (await db.query(`select to_json(${call}) as data`, params)).rows[0].data;
    });
    if (out === undefined) return send(res, 204, null);
    return send(res, 200, singleObject && Array.isArray(out) ? out[0] ?? null : out);
  } catch (err) {
    const e = pgError(err, claims);
    return send(res, e.status, e.body);
  }
}

// ─── GoTrue subset ────────────────────────────────────────────────────
const refreshTokens = new Map();
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 32).toString("hex")}`;
}
function checkPassword(password, stored) {
  const [, salt, hash] = String(stored ?? "").split("$");
  if (!salt || !hash) return false;
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), crypto.scryptSync(password, salt, 32));
}
function userJson(u) {
  return {
    id: u.id,
    aud: "authenticated",
    role: "authenticated",
    email: u.email,
    email_confirmed_at: u.created_at,
    phone: "",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: u.raw_user_meta_data ?? {},
    identities: [],
    created_at: u.created_at,
    updated_at: u.created_at,
  };
}
function session(u) {
  const now = Math.floor(Date.now() / 1000);
  const access = signJwt({ sub: u.id, email: u.email, role: "authenticated", aud: "authenticated", iat: now, exp: now + 3600, session_id: crypto.randomUUID() });
  const refresh = crypto.randomBytes(24).toString("hex");
  refreshTokens.set(refresh, u.id);
  return { access_token: access, token_type: "bearer", expires_in: 3600, expires_at: now + 3600, refresh_token: refresh, user: userJson(u) };
}
async function handleAuth(req, res, url, body) {
  const route = url.pathname.replace(/^\/auth\/v1/, "");
  if (route === "/token" && req.method === "POST") {
    const grant = url.searchParams.get("grant_type");
    if (grant === "password") {
      const { rows } = await pool.query("select * from auth.users where lower(email) = lower($1)", [body?.email ?? ""]);
      const u = rows[0];
      if (!u || !checkPassword(body?.password ?? "", u.encrypted_password))
        return send(res, 400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials", error: "invalid_grant", error_description: "Invalid login credentials" });
      return send(res, 200, session(u));
    }
    if (grant === "refresh_token") {
      const id = refreshTokens.get(body?.refresh_token);
      if (!id) return send(res, 400, { code: 400, error_code: "refresh_token_not_found", msg: "Invalid Refresh Token" });
      refreshTokens.delete(body.refresh_token);
      const { rows } = await pool.query("select * from auth.users where id = $1", [id]);
      return send(res, 200, session(rows[0]));
    }
  }
  if (route === "/user" && req.method === "GET") {
    const claims = verifyJwt(req.headers.authorization?.replace(/^Bearer\s+/i, ""));
    if (!claims?.sub) return send(res, 401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT" });
    const { rows } = await pool.query("select * from auth.users where id = $1", [claims.sub]);
    if (!rows[0]) return send(res, 404, { code: 404, error_code: "user_not_found", msg: "User not found" });
    return send(res, 200, userJson(rows[0]));
  }
  if (route === "/logout" && req.method === "POST") return send(res, 204, null);
  if (route === "/signup") return send(res, 422, { code: 422, error_code: "signup_disabled", msg: "Signups not allowed for this instance" });
  return send(res, 404, { code: 404, msg: "not found" });
}

// ─── Storage subset ───────────────────────────────────────────────────
const MIME = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };
async function handleStorage(req, res, url, rawBody) {
  const route = decodeURIComponent(url.pathname.replace(/^\/storage\/v1/, ""));
  const pub = route.match(/^\/object\/public\/([\w-]+)\/(.+)$/);
  if (pub && req.method === "GET") {
    const { rows } = await pool.query("select b.public, o.name from storage.buckets b left join storage.objects o on o.bucket_id = b.id and o.name = $2 where b.id = $1", [pub[1], pub[2]]);
    const file = path.join(STORAGE_DIR, pub[1], pub[2]);
    if (!rows[0]?.public || !rows[0].name || !fs.existsSync(file)) return send(res, 400, { statusCode: "404", error: "not_found", message: "Object not found" });
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).slice(1)] ?? "application/octet-stream", "Cache-Control": "public, max-age=3600", ...cors });
    return fs.createReadStream(file).pipe(res);
  }
  const claims = claimsFrom(req);
  const up = route.match(/^\/object\/([\w-]+)\/(.+)$/);
  if (up && req.method === "POST") {
    const [, bucket, name] = up;
    if (name.includes("..")) return send(res, 400, { statusCode: "400", error: "invalid_key", message: "Invalid key" });
    const { rows: b } = await pool.query("select * from storage.buckets where id = $1", [bucket]);
    if (!b[0]) return send(res, 400, { statusCode: "404", error: "Bucket not found", message: "Bucket not found" });
    const type = (req.headers["content-type"] ?? "").split(";")[0];
    if (b[0].allowed_mime_types && !b[0].allowed_mime_types.includes(type)) return send(res, 400, { statusCode: "415", error: "invalid_mime_type", message: `mime type ${type} is not supported` });
    if (b[0].file_size_limit && rawBody.length > Number(b[0].file_size_limit)) return send(res, 413, { statusCode: "413", error: "Payload too large", message: "The object exceeded the maximum allowed size" });
    try {
      await withRole(claims, (db) => db.query("insert into storage.objects (bucket_id, name, owner) values ($1, $2, $3)", [bucket, name, claims.sub ?? null]));
    } catch (err) {
      const unauthorised = err.code === "42501";
      return send(res, unauthorised ? 403 : 400, { statusCode: unauthorised ? "403" : "400", error: unauthorised ? "Unauthorized" : "Error", message: err.message });
    }
    const file = path.join(STORAGE_DIR, bucket, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, rawBody);
    return send(res, 200, { Key: `${bucket}/${name}`, Id: crypto.randomUUID() });
  }
  const del = route.match(/^\/object\/([\w-]+)$/);
  if (del && req.method === "DELETE") {
    const bucket = del[1];
    const prefixes = JSON.parse(rawBody.toString() || "{}").prefixes ?? [];
    try {
      const rows = await withRole(claims, async (db) => (await db.query("delete from storage.objects where bucket_id = $1 and name = any($2::text[]) returning name", [bucket, prefixes])).rows);
      for (const r of rows) fs.rmSync(path.join(STORAGE_DIR, bucket, r.name), { force: true });
      return send(res, 200, rows.map((r) => ({ name: r.name, bucket_id: bucket })));
    } catch (err) {
      return send(res, 400, { statusCode: "400", error: "Error", message: err.message });
    }
  }
  return send(res, 404, { statusCode: "404", error: "not_found", message: "Not found" });
}

// ─── HTTP server ──────────────────────────────────────────────────────
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,PATCH,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "Content-Range, Content-Profile, Preference-Applied",
};
function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...cors, ...(body !== null && body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers });
  res.end(body !== null && body !== undefined ? JSON.stringify(body) : undefined);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, null);
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks);
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/storage/v1")) return await handleStorage(req, res, url, raw);
    const body = raw.length ? JSON.parse(raw.toString()) : null;
    if (url.pathname.startsWith("/rest/v1/")) return await handleRest(req, res, url, body);
    if (url.pathname.startsWith("/auth/v1")) return await handleAuth(req, res, url, body);
    if (url.pathname === "/health") return send(res, 200, { ok: true });
    return send(res, 404, { message: "not found" });
  } catch (err) {
    console.error("[shim]", req.method, req.url, err);
    return send(res, 500, { message: String(err?.message ?? err) });
  }
});

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  await introspect();
  server.listen(PORT, "127.0.0.1", () => process.stdout.write(`[shim] listening on http://127.0.0.1:${PORT}\n`));
}
