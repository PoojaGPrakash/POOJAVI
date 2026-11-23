# POOJAVI THE LABEL — *Wear a Story*

A luxury storefront and content-managed catalogue for premium Indian fabrics and sarees.
Enquiry-led by design: **no prices, no cart, no checkout** — every product leads to a personal WhatsApp conversation.

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict) |
| Styling | Tailwind CSS 4, self-hosted Cormorant Garamond + Jost (OFL) |
| Backend | Supabase — PostgreSQL, Auth, Storage, Row Level Security |
| Forms | React Hook Form + Zod (same schemas validate client **and** server) |
| Tests | Vitest (unit), SQL RLS suite on PostgreSQL, Playwright E2E (desktop + mobile) |

---

## 1. Project structure

```
src/
  app/
    (store)/            Public storefront (home, fabrics, sarees, collections, category,
                        products, our-story, contact, search, policies)
    admin/login         Admin sign-in (no public registration)
    admin/(panel)/      Protected dashboard: products, categories, collections, banners,
                        instagram, enquiries, settings
    sitemap.ts robots.ts manifest.ts opengraph-image.tsx icon.svg apple-icon.png
  components/           brand/ (Logo, Monogram, TextileArt) · layout/ · home/ · product/
                        whatsapp/ · admin/ · ui/
  lib/
    supabase/           server (session), public (anon, cacheable), client (browser), proxy
    data/               public.ts (storefront queries) · admin.ts (dashboard queries)
    actions/            Server Actions (contact form + admin/*)
    validation/         Zod schemas
    whatsapp.ts storage.ts upload.ts auth.ts env.ts brand.ts utils.ts
  proxy.ts              Next 16 "proxy" (middleware): session refresh + /admin gate
supabase/
  migrations/           5 SQL migrations (schema, RLS, storage, seed, admin RPCs)
  tests/                RLS test-suite (+ minimal Supabase emulation for plain Postgres)
tests/
  unit/                 Vitest
  e2e/                  Playwright specs + test-only local Supabase gateway (shim/)
public/brand/           Vector wordmark, tagline lock-up and monogram (SVG/PNG)
```

## 2. Local setup

**Requirements:** Node.js ≥ 20.9 (22 LTS recommended), a Supabase project (free tier is fine).

```bash
npm install
cp .env.example .env.local      # then fill in the values below
npm run dev                      # http://localhost:3000
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | The **anon / publishable** key. Safe in the browser — RLS protects all data |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical URL, e.g. `https://www.poojavithelabel.com` (sitemap, OG, canonical) |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | – | Defaults to `media` (created by the migrations) |
| `NEXT_PUBLIC_FALLBACK_WHATSAPP_NUMBER` | – | Used only until a number is saved in Admin → Settings |
| `NEXT_PUBLIC_FALLBACK_CONTACT_EMAIL` | – | Same, for email |

> **The service-role key is never used by this app.** Do not add it to any environment variable.

## 3. Database setup (Supabase)

Run the migrations **in order**. Either:

**A. Supabase CLI** (recommended)
```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push            # applies supabase/migrations/*
```

**B. SQL Editor** — paste and run each file in `supabase/migrations/` in filename order.

What they create:

| Migration | Contents |
|---|---|
| `…01_schema.sql` | Tables `profiles, categories, products, product_images, collections, collection_products, homepage_banners, instagram_posts, site_settings, contact_enquiries`; PKs, FKs (RESTRICT on category→product, CASCADE on images/assignments), unique slugs & SKUs, indexes, `updated_at` triggers, `is_admin()`, search RPC, category delete/reassign RPC |
| `…02_rls.sql` | Least-privilege grants + RLS on **every** table |
| `…03_storage.sql` | Public-read `media` bucket (10 MB, JPG/PNG/WebP/AVIF) with admin-only write policies |
| `…04_seed.sql` | Initial categories (Raw Silk, Banarasi, Pochampally, Pure Silk, Handloom Fabrics, Designer Fabrics, Sarees) and site copy/policies — all editable |
| `…05_admin_rpc.sql` | Atomic `save_product` / `save_collection` (one transaction per save) |

**Auth settings (Supabase → Authentication):**
- *Sign In / Providers → Email:* enabled. **Turn off "Allow new users to sign up".**
- *URL Configuration → Site URL:* your production URL.

## 4. Admin setup

There is deliberately **no public registration**. Admins are created by the project owner:

1. Supabase → **Authentication → Users → Add user → Create new user**. Enter email + a strong password, tick *Auto Confirm User*.
2. Supabase → **SQL Editor**, run:
   ```sql
   update public.profiles set role = 'admin' where email = 'owner@yourdomain.com';
   ```
3. Sign in at **`/admin/login`**.

Every new auth user gets the harmless `viewer` role automatically. Roles can only be changed with SQL — no client (not even an admin) can modify `profiles`. To revoke access: `update public.profiles set role = 'viewer' where email = '…';` (or delete the user).

### Using the dashboard
- **Site Content & Settings** — set the WhatsApp number first (WhatsApp buttons stay hidden until a valid number exists, so there are never dead buttons). Also: Instagram, email, announcement bar, homepage intro, brand story, craftsmanship, footer text, policies, SEO.
- **Categories** — name, slug, Fabrics/Sarees department, image, description, order, active. A category with products cannot be deleted until you move or delete its products (enforced in the UI *and* by the database).
- **Products** — up to 12 images (drag-and-drop, progress, reorder, alt text, remove), SKU, fabric details, weaving technique, colours, featured/new-arrival flags, draft/publish, collection assignment. Published products appear on the site immediately.
- **Collections** — curated edits with banners, ordered product lists, display order, active, *Featured on homepage*.
- **Homepage Banners** — hero slides (rotate automatically when several are active). Without banners the homepage shows a branded hero.
- **Instagram Gallery** — images with optional post links.
- **Enquiries** — contact-form messages; mark read, archive, delete, reply on WhatsApp/email.

## 5. Deployment (Vercel)

1. Push the repository to GitHub/GitLab and import it in Vercel (framework preset: Next.js).
2. Add the environment variables from §2 for *Production* (and *Preview* if used).
3. Deploy. Then set your domain and update `NEXT_PUBLIC_SITE_URL` + Supabase *Site URL*.

Any Node host works too: `npm ci && npm run build && npm start` (port 3000).

**Caching:** storefront pages are statically generated and revalidated every 5 minutes; every admin save also revalidates the whole storefront instantly. Admin pages are always dynamic and `no-store`.

## 6. Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Develop / production build / serve |
| `npm run typecheck` | `tsc --noEmit` (strict, `noUncheckedIndexedAccess`) |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript, `no-explicit-any` = error) |
| `npm test` | Vitest unit tests |
| `npm run test:db` | Migrations + 77-assertion RLS/constraint suite on a throw-away PostgreSQL |
| `npm run test:e2e` | Full-stack Playwright suite (see TESTING.md) |
| `npm run check` | typecheck + lint + unit + build |

`test:db` and `test:e2e` need PostgreSQL 15+ binaries (`initdb`, `pg_ctl`, `psql`) and, for E2E, Playwright's Chromium (`npx playwright install chromium`).

## 7. Security model

- **RLS on every table.** Anonymous users can read only active categories/collections/banners, published products in active categories (and their images), and site settings; they may *insert* contact enquiries only. All writes require `profiles.role = 'admin'` via `is_admin()`.
- **Defence in depth:** the proxy redirects signed-out users away from `/admin`; every admin page calls `requireAdminPage()`; every Server Action calls `requireAdminAction()` and re-validates input with Zod; the database enforces RLS regardless.
- Image uploads go directly from the browser to Storage using the admin's own session; storage policies reject non-admins. Removed/replaced images are deleted from storage.
- No service-role key; no secrets in client code; admin routes are `noindex` and excluded from `robots.txt`.
- Contact form: honeypot field, server-side validation, per-IP rate limit, DB check constraints.
- Security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`).

## 8. Brand assets

`public/brand/` contains the vector **POOJAVI / THE LABEL** wordmark (dark and light), the lock-up with **WEAR A STORY**, and the **P monogram** (SVG + 192/512 PNG). The favicon (`src/app/icon.svg`), Apple touch icon and Open Graph image use the same marks. Fonts: Cormorant Garamond and Jost, both SIL Open Font License, self-hosted (no third-party font requests).

## 9. Content notes

- Seeded copy (story, craftsmanship, policies) is intentionally general and makes **no certification, manufacturing or heritage claims**. Policy texts are marked *[Please review…]* — replace them with your reviewed versions in Admin → Settings → Footer & Policies before launch.
- Where an image has not been uploaded yet, the site shows an on-brand woven-pattern artwork rather than a broken image.
