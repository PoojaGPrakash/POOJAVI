"use client";
import { useState } from "react";
import Link from "next/link";
const wa=process.env.NEXT_PUBLIC_WHATSAPP_NUMBER||"";
export default function CustomOrders(){
 const [f,setF]=useState({name:"",fabric:"",colour:"",quantity:"",occasion:"",notes:""});
 const submit=e=>{e.preventDefault(); const msg=`Hello POOJAVI, I have a custom enquiry.\n\nName: ${f.name}\nFabric: ${f.fabric}\nColour: ${f.colour}\nQuantity: ${f.quantity}\nOccasion: ${f.occasion}\nNotes: ${f.notes}`; if(wa) window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`,"_blank");};
 return <main><Header/><section className="page-intro"><p className="eyebrow">CUSTOM ORDERS</p><h1>Tell us your story.</h1><p>Share what you are looking for and we’ll continue the conversation on WhatsApp.</p></section><section className="form-wrap"><form onSubmit={submit}><label>Your name<input required value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></label><label>Fabric / weave<input value={f.fabric} onChange={e=>setF({...f,fabric:e.target.value})}/></label><label>Preferred colour<input value={f.colour} onChange={e=>setF({...f,colour:e.target.value})}/></label><label>Approx. quantity<input value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/></label><label>Occasion<input value={f.occasion} onChange={e=>setF({...f,occasion:e.target.value})}/></label><label>Anything else?<textarea rows="5" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/></label><button className="button dark" type="submit">Continue on WhatsApp ↗</button></form></section><Footer/></main>
}
function Header(){return <header className="site-header"><Link className="brand" href="/">POOJAVI<span>Wear a Story</span></Link><nav><Link href="/collections">Collections</Link><Link href="/collections/all">Shop All</Link><Link href="/custom-orders">Custom Orders</Link></nav><Link href="/">Home</Link></header>}
function Footer(){return <footer><div><Link className="brand" href="/">POOJAVI<span>Wear a Story</span></Link></div></footer>}
