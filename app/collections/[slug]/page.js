"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function CollectionPage({params}) {
  const [c,setC]=useState({collections:[],products:[]});
  useEffect(()=>{fetch("/api/catalog").then(r=>r.json()).then(setC)},[]);
  const col=c.collections.find(x=>x.slug===params.slug);
  const products=params.slug==="all"?c.products:c.products.filter(p=>p.collection===params.slug);
  return <main><Header/><section className="page-intro left">{<p className="eyebrow">COLLECTION</p>}<h1>{col?.name || (params.slug==="all"?"Shop all":"Collection")}</h1><p>{col?.description || "Discover the POOJAVI edit."}</p></section><div className="filterbar"><span>{products.length} pieces</span><span>Curated selection • Enquire on WhatsApp</span></div><section className="section tight"><div className="product-grid">{products.map(p=><ProductCard key={p.id} p={p}/>)}</div></section><Footer/></main>
}
function ProductCard({p}){return <Link className="product-card" href={`/product/${p.slug}`}><div className="product-image">{p.images?.[0]?<img src={p.images[0]} alt={p.name}/>:<div className="image-placeholder"><span>POOJAVI</span></div>}{p.newArrival&&<b>NEW</b>}</div><div className="product-meta"><div><h3>{p.name}</h3><p>{p.category||"Textiles"}</p></div><span>View →</span></div></Link>}
function Header(){return <header className="site-header"><Link className="brand" href="/">POOJAVI<span>Wear a Story</span></Link><nav><Link href="/collections">Collections</Link><Link href="/collections/all">Shop All</Link><Link href="/custom-orders">Custom Orders</Link></nav><Link href="/">Home</Link></header>}
function Footer(){return <footer><div><Link className="brand" href="/">POOJAVI<span>Wear a Story</span></Link></div></footer>}
