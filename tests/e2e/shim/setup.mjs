// TEST-ONLY: creates the e2e users and prints the env the app needs.
import pg from "pg";
import { hashPassword, signJwt } from "./server.mjs";

const pool = new pg.Pool({ connectionString: process.env.SHIM_DATABASE_URL });
await pool.query("alter table auth.users add column if not exists encrypted_password text");

const users = [
  { email: "admin@poojavi.test", password: "Admin#Pass123", role: "admin", name: "Pooja Admin" },
  { email: "viewer@poojavi.test", password: "Viewer#Pass123", role: "viewer", name: "Not Admin" },
];
for (const u of users) {
  const { rows } = await pool.query(
    `insert into auth.users (email, encrypted_password, raw_user_meta_data) values ($1, $2, jsonb_build_object('full_name', $3::text))
     on conflict do nothing returning id`,
    [u.email, hashPassword(u.password), u.name],
  );
  if (rows[0]) await pool.query("update public.profiles set role = $1 where id = $2", [u.role, rows[0].id]);
}
await pool.end();

const anon = signJwt({ role: "anon", iss: "supabase-test", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 10 * 365 * 86400 });
process.stdout.write(anon);
