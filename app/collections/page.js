"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Collections() {
  const [c, setC] = useState({collections:[]});
  useEffect(()=>{fetch("/api/catalog").then(r=>r.json()).then(setC)},[]);
  return <main><Header/><section className="page-intro"><p className="eyebrow">THE POOJAVI COLLECTIONS</p><h1>Find your fabric story.</h1><p>Explore our curated edits, each with its own character.</p></section><section className="section"><div className="collection-grid large">{c.collections.map((x,i)=><Link className="collection-card c"+(i%4) key={x.id} href={`/collections/${x.slug}`}>{x.cover?<img src={x.cover} alt=""/>:<div className="collection-art"/>}<div><span>{x.name}</span><small>{x.description}</small></div></Link>)}</div></section><Footer/></main>
}
function Header(){return <header className="site-header"><Link className="brand" href="/">POOJAVI<span>Wear a Story</span></Link><nav><Link href="/collections">Collections</Link><Link href="/collections/all">Shop All</Link><Link href="/custom-orders">Custom Orders</Link></nav><Link href="/">Home</Link></header>}
function Footer(){return <footer><div><Link className="brand" href="/">POOJAVI<span>Wear a Story</span></Link><p>Premium fabrics & textile stories.</p></div></footer>}
