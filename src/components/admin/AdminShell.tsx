"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { ExternalLink, FolderTree, GalleryHorizontal, Images, Inbox, LayoutDashboard, Layers, Loader2, LogOut, Menu, Package, Settings, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { signOut } from "@/lib/actions/admin/auth";
import { cn } from "@/lib/utils";
import { ToastProvider } from "./Toast";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/collections", label: "Collections", icon: Layers },
  { href: "/admin/banners", label: "Homepage Banners", icon: Images },
  { href: "/admin/instagram", label: "Instagram Gallery", icon: GalleryHorizontal },
  { href: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { href: "/admin/settings", label: "Site Content & Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children, email, newEnquiries }: { children: ReactNode; email: string; newEnquiries: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const [signingOut, startSignOut] = useTransition();

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center justify-center border-b border-ivory/10">
        <Logo size="sm" tone="light" href="/admin" />
      </div>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-5">
        <ul className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 px-3 text-sm transition-colors",
                    active ? "bg-ivory/10 text-ivory" : "text-ivory/65 hover:bg-ivory/5 hover:text-ivory",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span className="flex-1">{label}</span>
                  {href === "/admin/enquiries" && newEnquiries > 0 && (
                    <span className="min-w-5 rounded-full bg-champagne px-1.5 text-center text-[0.65rem] font-semibold text-charcoal">{newEnquiries}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="space-y-1 border-t border-ivory/10 p-3">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-3 px-3 text-sm text-ivory/65 hover:text-ivory">
          <ExternalLink className="h-4 w-4" strokeWidth={1.5} /> View website
        </a>
        <button
          type="button"
          onClick={() => startSignOut(() => signOut())}
          disabled={signingOut}
          className="flex min-h-11 w-full items-center gap-3 px-3 text-left text-sm text-ivory/65 hover:text-ivory disabled:opacity-60"
        >
          {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" strokeWidth={1.5} />} Sign out
        </button>
        <p className="truncate px-3 pt-2 text-[0.7rem] text-ivory/40" title={email}>
          {email}
        </p>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="min-h-svh bg-[#f3efe8]">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-charcoal lg:block">{sidebar}</aside>

        {/* Mobile top bar */}
        <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-charcoal px-4 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} aria-label="Open admin menu" aria-expanded={open} className="-ml-2 flex h-11 w-11 items-center justify-center text-ivory">
            <Menu className="h-5 w-5" />
          </button>
          <Logo size="sm" tone="light" href="/admin" />
          <span className="w-9" aria-hidden="true" />
        </div>

        {/* Mobile drawer */}
        <div role="dialog" aria-modal="true" aria-label="Admin menu" className={cn("fixed inset-0 z-40 lg:hidden", open ? "visible" : "invisible")} aria-hidden={!open}>
          <div className={cn("absolute inset-0 bg-charcoal/50 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
          <div className={cn("absolute inset-y-0 left-0 w-72 max-w-[85%] bg-charcoal transition-transform duration-300", open ? "translate-x-0" : "-translate-x-full")}>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close admin menu" className="absolute top-4 right-3 z-10 flex h-11 w-11 items-center justify-center text-ivory/70">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>

        <main className="px-4 py-8 sm:px-8 lg:ml-64 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
