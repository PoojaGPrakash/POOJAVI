"use client";
import { useEffect, useState } from "react";
import { slugify } from "../../lib/catalog";

const emptyCollection = { name: "", description: "", cover: "" };
const emptyProduct = { name: "", collection: "", category: "Fabrics", description: "", details: "", images: [], featured: false, newArrival: false, available: true };

export default function Admin() {
  const [logged, setLogged] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [catalog, setCatalog] = useState({ collections: [], products: [] });
  const [col, setCol] = useState(emptyCollection);
  const [prod, setProd] = useState(emptyProduct);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetch("/api/admin/catalog", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("login");
        const data = await r.json();
        setCatalog(data);
        setLogged(true);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const loadCatalog = async () => {
    const r = await fetch("/api/admin/catalog", { cache: "no-store" });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Could not load catalog.");
    setCatalog(data);
    return data;
  };

  const login = async (e) => {
    e?.preventDefault();
    setMessage("Signing in…");
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return setMessage(data.error || "Invalid password.");
    setLogged(true);
    setPassword("");
    await loadCatalog();
    setMessage("Welcome to POOJAVI Studio.");
  };

  const save = async (next, success = "Published successfully.") => {
    setSaving(true);
    setMessage("Saving…");
    try {
      const r = await fetch("/api/admin/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Could not save.");
      setCatalog(data.catalog || next);
      setMessage(success);
      return true;
    } catch (error) {
      setMessage(error.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const addCollection = async (e) => {
    e.preventDefault();
    if (!col.name.trim()) return setMessage("Collection name is required.");
    const item = { id: crypto.randomUUID(), slug: slugify(col.name), name: col.name.trim(), description: col.description.trim(), cover: col.cover };
    const ok = await save({ ...catalog, collections: [...catalog.collections, item] });
    if (ok) setCol(emptyCollection);
  };

  const addProduct = async (e) => {
    e.preventDefault();
    if (!prod.name.trim()) return setMessage("Product name is required.");
    if (!prod.collection) return setMessage("Choose a collection first.");
    const item = { ...prod, id: crypto.randomUUID(), slug: slugify(prod.name), name: prod.name.trim(), description: prod.description.trim(), details: prod.details.trim() };
    const ok = await save({ ...catalog, products: [...catalog.products, item] });
    if (ok) setProd({ ...emptyProduct, collection: catalog.collections[0]?.slug || "" });
  };

  const upload = async (file, kind) => {
    if (!file) return;
    setUploading(true);
    setMessage("Uploading image…");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Image upload failed.");
      if (kind === "cover") setCol((x) => ({ ...x, cover: data.url }));
      else setProd((x) => ({ ...x, images: [...x.images, data.url] }));
      setMessage("Image uploaded. You can publish now.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = async (type, id, name) => {
    const warning = type === "collection"
      ? `Delete “${name}”? Its products will also be removed.`
      : `Delete “${name}”?`;
    if (!window.confirm(warning)) return;
    setSaving(true);
    setMessage("Deleting…");
    try {
      const r = await fetch("/api/admin/catalog", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Could not delete.");
      setCatalog(data.catalog);
      setMessage(`${type === "collection" ? "Collection" : "Product"} deleted.`);
      if (editing === id) setEditing(null);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (checking) return <main className="admin-login"><div className="login-card"><p className="eyebrow">POOJAVI STUDIO</p><h1>Loading…</h1></div></main>;

  if (!logged) return (
    <main className="admin-login">
      <form className="login-card" onSubmit={login}>
        <p className="eyebrow">POOJAVI STUDIO</p><h1>Admin access</h1>
        <input autoFocus type="password" placeholder="Admin password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="button dark" type="submit">Enter Studio</button>
        <p>{message}</p>
      </form>
    </main>
  );

  return (
    <main className="admin">
      <header className="admin-head"><div><p className="eyebrow">POOJAVI STUDIO</p><h1>Catalogue</h1></div><button onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); location.reload(); }}>Sign out</button></header>
      <p className="status">{message}</p>

      <div className="admin-grid">
        <section className="admin-card"><h2>New collection</h2><form onSubmit={addCollection}>
          <input required placeholder="Collection name" value={col.name} onChange={(e) => setCol({ ...col, name: e.target.value })} />
          <textarea placeholder="Short description" value={col.description} onChange={(e) => setCol({ ...col, description: e.target.value })} />
          <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0], "cover")} />
          {col.cover && <img className="upload-preview" src={col.cover} alt="Collection cover preview" />}
          <button disabled={saving || uploading} className="button dark" type="submit">{saving ? "Saving…" : "Publish collection"}</button>
        </form></section>

        <section className="admin-card"><h2>New product</h2><form onSubmit={addProduct}>
          <input required placeholder="Product name" value={prod.name} onChange={(e) => setProd({ ...prod, name: e.target.value })} />
          <select required value={prod.collection} onChange={(e) => setProd({ ...prod, collection: e.target.value })}><option value="">Choose collection</option>{catalog.collections.map((x) => <option key={x.id} value={x.slug}>{x.name}</option>)}</select>
          <input placeholder="Category" value={prod.category} onChange={(e) => setProd({ ...prod, category: e.target.value })} />
          <textarea placeholder="Description" value={prod.description} onChange={(e) => setProd({ ...prod, description: e.target.value })} />
          <textarea placeholder="Details: weave, width, care, etc." value={prod.details} onChange={(e) => setProd({ ...prod, details: e.target.value })} />
          <input type="file" accept="image/*" multiple onChange={(e) => Array.from(e.target.files || []).forEach((f) => upload(f, "product"))} />
          {uploading && <p>Uploading…</p>}
          <div className="mini-gallery">{prod.images.map((x) => <img key={x} src={x} alt="Product upload" />)}</div>
          <label className="check"><input type="checkbox" checked={prod.featured} onChange={(e) => setProd({ ...prod, featured: e.target.checked })} /> Featured</label>
          <label className="check"><input type="checkbox" checked={prod.newArrival} onChange={(e) => setProd({ ...prod, newArrival: e.target.checked })} /> New arrival</label>
          <label className="check"><input type="checkbox" checked={prod.available} onChange={(e) => setProd({ ...prod, available: e.target.checked })} /> Available</label>
          <button disabled={saving || uploading} className="button dark" type="submit">{saving ? "Saving…" : "Publish product"}</button>
        </form></section>
      </div>

      <section className="admin-card"><div className="admin-section-head"><h2>Collections</h2><span>{catalog.collections.length} collections</span></div>
        <div className="admin-list">{catalog.collections.map((x) => <div key={x.id}><div><strong>{x.name}</strong><span>{catalog.products.filter((p) => p.collection === x.slug).length} products</span></div><button className="delete-button" disabled={saving} onClick={() => deleteItem("collection", x.id, x.name)}>Delete</button></div>)}</div>
      </section>

      <section className="admin-card"><div className="admin-section-head"><h2>Products</h2><span>{catalog.products.length} products</span></div>
        <div className="admin-list">{catalog.products.map((x) => <div key={x.id}><div><strong>{x.name}</strong><span>{catalog.collections.find((c) => c.slug === x.collection)?.name || "Unassigned"}</span></div><button className="delete-button" disabled={saving} onClick={() => deleteItem("product", x.id, x.name)}>Delete</button></div>)}</div>
      </section>
    </main>
  );
}
