"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const wa=process.env.NEXT_PUBLIC_WHATSAPP_NUMBER||"";
const whatsapp=(p)=>wa?`https://wa.me/${wa}?text=${encodeURIComponent(`Hello POOJAVI, I am interested in "${p.name}". Please share availability and purchase details.`)}`:"#";

export default function Product({params}) {
 const [c,setC]=useState({products:[],collections:[]}); const [active,setActive]=useState(0);
 useEffect(()=>{fetch("/api/catalog").then(r=>r.json()).then(setC)},[]);
 const p=c.products.find(x=>x.slug===params.slug); const col=c.collections.find(x=>x.slug===p?.collection);
 if(!p) return <main><Header/><div className="empty">Product not found.</div></main>;
 const imgs=p.images?.length?p.images:[""];
 return <main><Header/><div className="product-detail"><div className="gallery"><div className="main-photo">{imgs[active]?<img src={imgs[active]} alt={p.name}/>:<div className="image-placeholder big"><span>POOJAVI</span></div>}</div><div className="thumbs">{imgs.map((x,i)=><button key={i} onClick={()=>setActive(i)}>{x?<img src={x} alt=""/>:<span>POOJAVI</span>}</button>)}</div></div><div className="product-copy"><p className="eyebrow">{col?.name||p.category||"TEXTILE"}</p><h1>{p.name}</h1><p className="lead">{p.description}</p><div className="enquiry-box"><strong>Interested in this piece?</strong><p>We’ll confirm availability, fabric details and purchase options with you personally.</p><a className="button dark" href={whatsapp(p)} target="_blank" rel="noreferrer">Enquire on WhatsApp ↗</a></div><div className="details"><div><span>DETAILS</span><p>{p.details||"Please enquire for weave, width, composition and care information."}</p></div><div><span>AVAILABILITY</span><p>{p.available===false?"Currently unavailable":"Available — please enquire for current stock."}</p></div></div><Link className="text-link" href={`/collections/${p.collection}`}>← Back to {col?.name||"collection"}</Link></div></div><Footer/><a className="floating-wa" href={whatsapp(p)} target="_blank">WhatsApp</a></main>
}
function Header(){return <header className="site-header"><Link className="brand" href="/">POOJAVI<span>Wear a Story</span></Link><nav><Link href="/collections">Collections</Link><Link href="/collections/all">Shop All</Link><Link href="/custom-orders">Custom Orders</Link></nav><Link href="/">Home</Link></header>}
function Footer(){return <footer><div><Link className="brand" href="/">POOJAVI<span>Wear a Story</span></Link></div></footer>}
