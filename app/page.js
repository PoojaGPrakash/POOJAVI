"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

function whatsapp(message) {
  if (!wa) return "#";
  return `https://wa.me/${wa}?text=${encodeURIComponent(message)}`;
}

export default function Home() {
  const [catalog, setCatalog] = useState({ collections: [], products: [] });
  const [query, setQuery] = useState("");

  useEffect(() => { fetch("/api/catalog").then(r => r.json()).then(setCatalog).catch(() => {}); }, []);

  const featured = useMemo(() => catalog.products.filter(p => p.featured && p.available).slice(0, 6), [catalog]);

  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/">POOJAVI<span>Wear a Story</span></Link>
        <nav>
          <Link href="/collections">Collections</Link>
          <Link href="/collections/all">Shop All</Link>
          <Link href="/custom-orders">Custom Orders</Link>
        </nav>
        <div className="header-actions">
          <input aria-label="Search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search" />
          <Link href={wa ? whatsapp("Hello POOJAVI, I would like to enquire about your collection.") : "#"} target="_blank">WhatsApp</Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">THE POOJAVI EDIT</p>
          <h1>Wear a Story.</h1>
          <p>Curated textiles, timeless colour and beautiful Indian craft — selected for pieces that feel personal.</p>
          <div className="hero-actions">
            <Link className="button dark" href="/collections/all">Explore the collection</Link>
            <Link className="text-link" href="/custom-orders">Create something custom →</Link>
          </div>
        </div>
        <div className="hero-art"><div className="fabric-ribbon r1"/><div className="fabric-ribbon r2"/><div className="fabric-ribbon r3"/></div>
      </section>

      <section className="section">
        <div className="section-heading"><div><p className="eyebrow">CURATED FOR YOU</p><h2>Shop by collection</h2></div><Link href="/collections">View all →</Link></div>
        <div className="collection-grid">
          {catalog.collections.map((c, i) => (
            <Link className={`collection-card c${i % 4}`} key={c.id} href={`/collections/${c.slug}`}>
              {c.cover ? <img src={c.cover} alt="" /> : <div className="collection-art"/>}
              <div><span>{c.name}</span><small>{c.description}</small></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section soft">
        <div className="section-heading"><div><p className="eyebrow">THE LATEST STORIES</p><h2>New & noteworthy</h2></div><Link href="/collections/all">Shop all →</Link></div>
        <div className="product-grid">
          {featured.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      <section className="story-band">
        <div><p className="eyebrow">POOJAVI</p><h2>Where every thread<br/>tells a story.</h2></div>
        <p>We believe fabric is more than material. It carries colour, craft, memory and the feeling of an occasion. POOJAVI brings those stories together in a considered collection.</p>
      </section>

      <section className="section custom">
        <p className="eyebrow">MADE FOR YOUR STORY</p>
        <h2>Looking for something specific?</h2>
        <p>Share your colour, fabric, occasion or reference image with us. We’ll help you find the right textile.</p>
        <Link className="button dark" href="/custom-orders">Talk to POOJAVI</Link>
      </section>

      <Footer />
      <a className="floating-wa" href={whatsapp("Hello POOJAVI, I would like to enquire about your collection.")} target="_blank" rel="noreferrer">WhatsApp</a>
    </main>
  );
}

function ProductCard({ p }) {
  return <Link href={`/product/${p.slug}`} className="product-card">
    <div className="product-image">{p.images?.[0] ? <img src={p.images[0]} alt={p.name}/> : <div className="image-placeholder"><span>POOJAVI</span></div>}{p.newArrival && <b>NEW</b>}</div>
    <div className="product-meta"><div><h3>{p.name}</h3><p>{p.category || "Textiles"}</p></div><span>View →</span></div>
  </Link>;
}

function Footer() {
  return <footer><div><Link className="brand" href="/">POOJAVI<span>Wear a Story</span></Link><p>Premium fabrics & textile stories.</p></div><div><h4>Explore</h4><Link href="/collections">Collections</Link><Link href="/custom-orders">Custom Orders</Link></div><div><h4>Enquiries</h4><a href={whatsapp("Hello POOJAVI, I would like to enquire.")} target="_blank">WhatsApp</a></div><div className="footer-note">© {new Date().getFullYear()} POOJAVI</div></footer>;
}
