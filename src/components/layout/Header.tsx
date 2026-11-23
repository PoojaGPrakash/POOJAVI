"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Menu, Search, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { brand, mainNav } from "@/lib/brand";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const searchInput = useRef<HTMLInputElement>(null);
  const menuId = useId();
  const searchId = useId();

  // Close overlays on navigation (state derived during render, no effect needed).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    const open = menuOpen || searchOpen;
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    if (open) window.addEventListener("keydown", onKey);
    if (searchOpen) searchInput.current?.focus();
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, searchOpen]);

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    const term = typeof q === "string" ? q.trim() : "";
    if (term.length < 2) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/85">
      <div className="container-luxe">
        <div className="grid h-[72px] grid-cols-[1fr_auto_1fr] items-center lg:h-[92px]">
          {/* Left */}
          <div className="flex items-center">
            <button
              type="button"
              className="-ml-2 inline-flex h-11 w-11 items-center justify-center lg:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-[22px] w-[22px]" strokeWidth={1.25} />
            </button>
            <p className="hidden font-serif text-[0.95rem] tracking-[0.18em] text-muted italic lg:block">{brand.tagline}</p>
          </div>

          {/* Centre */}
          <div className="flex justify-center">
            <Logo size="md" />
          </div>

          {/* Right */}
          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center transition-colors hover:text-burgundy"
              aria-label="Search"
              aria-expanded={searchOpen}
              aria-controls={searchId}
              onClick={() => setSearchOpen((v) => !v)}
            >
              <Search className="h-[20px] w-[20px]" strokeWidth={1.25} />
            </button>
            <WhatsAppButton variant="icon" label="Chat on WhatsApp" className="-mr-2" />
          </div>
        </div>

        {/* Desktop navigation */}
        <nav aria-label="Main" className="hidden border-t border-line/50 lg:block">
          <ul className="flex h-12 items-center justify-center gap-10 xl:gap-14">
            {mainNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative py-2 text-[0.68rem] font-medium tracking-[0.24em] uppercase transition-colors hover:text-burgundy",
                      active ? "text-burgundy" : "text-charcoal/85",
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute -bottom-0.5 left-1/2 h-px w-4 -translate-x-1/2 bg-burgundy transition-opacity",
                        active ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Search panel */}
      <div
        id={searchId}
        className={cn(
          "absolute inset-x-0 top-full border-b border-line/60 bg-ivory transition-[opacity,visibility] duration-300",
          searchOpen ? "visible opacity-100" : "invisible opacity-0",
        )}
        aria-hidden={!searchOpen}
      >
        <form role="search" onSubmit={onSearch} className="container-luxe flex items-center gap-4 py-6 sm:py-8">
          <label htmlFor="site-search" className="sr-only">
            Search fabrics and sarees
          </label>
          <Search className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.25} aria-hidden="true" />
          <input
            ref={searchInput}
            id="site-search"
            name="q"
            type="search"
            minLength={2}
            maxLength={80}
            required
            tabIndex={searchOpen ? 0 : -1}
            placeholder="Search by name, weave, colour or reference"
            className="w-full border-0 bg-transparent font-serif text-xl placeholder:text-charcoal/35 focus:outline-none sm:text-3xl"
          />
          <button type="submit" className="btn-primary hidden sm:inline-flex" tabIndex={searchOpen ? 0 : -1}>
            Search
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center"
            aria-label="Close search"
            tabIndex={searchOpen ? 0 : -1}
          >
            <X className="h-5 w-5" strokeWidth={1.25} />
          </button>
        </form>
      </div>
      {searchOpen && (
        <div className="fixed inset-x-0 top-full bottom-0 -z-10 h-screen bg-charcoal/25" aria-hidden="true" onClick={() => setSearchOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={cn("fixed inset-0 z-50 lg:hidden", menuOpen ? "visible" : "invisible")}
        aria-hidden={!menuOpen}
      >
        <div
          className={cn("absolute inset-0 bg-charcoal/40 transition-opacity duration-300", menuOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-ivory shadow-xl transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)]",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-[72px] items-center justify-between border-b border-line/60 px-5">
            <Logo size="sm" />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="-mr-2 inline-flex h-11 w-11 items-center justify-center"
              aria-label="Close menu"
              tabIndex={menuOpen ? 0 : -1}
            >
              <X className="h-5 w-5" strokeWidth={1.25} />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-6">
            <ul className="space-y-1">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    tabIndex={menuOpen ? 0 : -1}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center border-b border-line/50 font-serif text-[1.6rem]",
                      isActive(pathname, item.href) ? "text-burgundy" : "text-charcoal",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/new-arrivals" tabIndex={menuOpen ? 0 : -1} className="flex min-h-12 items-center border-b border-line/50 font-serif text-[1.6rem]">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </nav>
          <div className="border-t border-line/60 p-5">
            <WhatsAppButton variant="primary" className="w-full" />
          </div>
        </div>
      </div>
    </header>
  );
}
