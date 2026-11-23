# Testing Report — POOJAVI THE LABEL

Run date: 23 Nov 2026 · Node 22.23 · Next.js 16.4.6 · PostgreSQL 16 · Chromium (Playwright 1.63)

## Summary

| Check | Command | Result |
|---|---|---|
| Dependency install | `npm install` | ✅ 0 vulnerabilities (`npm audit`) |
| TypeScript (strict + `noUncheckedIndexedAccess`) | `npm run typecheck` | ✅ 0 errors |
| ESLint (core-web-vitals, TS, `no-explicit-any` as error) | `npm run lint` | ✅ 0 errors, 0 warnings |
| Unit tests | `npm test` | ✅ 28 / 28 |
| Migrations + RLS / constraint suite | `npm run test:db` | ✅ 77 / 77 assertions |
| Production build | `npm run build` | ✅ compiled, all routes generated |
| End-to-end (desktop + mobile) | `npm run test:e2e` | ✅ 23 / 23 |

No warnings were suppressed and no checks were disabled to make these pass.

## How the E2E environment works — please read

The test sandbox could not reach Supabase or pull Supabase's Docker images, so the E2E suite runs against:

1. a **real PostgreSQL 16** database with **all five real migrations** applied (RLS, grants, triggers, RPCs, storage policies), and
2. a **test-only gateway** (`tests/e2e/shim/server.mjs`) that speaks the subset of the Supabase REST, Auth and Storage HTTP APIs the app uses. Every request runs as the Postgres role in the caller's JWT with `request.jwt.claims` set, so **authorisation is decided by the real RLS policies**, not by the shim.

The application code is unchanged in test mode except two test-only build flags (`NEXT_DIST_DIR`, and `NEXT_ALLOW_LOCAL_IMAGES` so `next/image` may optimise images served from 127.0.0.1). The shim is never deployed.

**Before launch, please run the manual smoke test in §5 against your real Supabase project** — that is the one thing these automated tests cannot cover from the sandbox.

## 1. Unit tests (`tests/unit`)
- WhatsApp: number normalisation, `wa.me` deep links, URL encoding, exact product enquiry wording.
- Slugify / text helpers / colour list parsing.
- Storage paths: unique dated paths, unsupported types, path-traversal rejection, file type/size validation.
- Zod schemas: products, categories, delete-with-reassignment, banners (blocks `javascript:` links), contact form (honeypot), settings.
- Rate limiter windowing.

## 2. Database / RLS suite (`supabase/tests/10_rls.test.sql`) — 77 assertions
- **Constraints:** slug format, unique slugs/SKUs (multiple NULL SKUs allowed), category FK RESTRICT, singleton settings row, enquiry validation.
- **Anonymous:** sees only published products in active categories, their images, active collections and visible assignments; cannot read profiles/enquiries; cannot insert/update/delete store data; cannot call admin RPCs; can submit an enquiry but cannot set its status; cannot upload to storage.
- **Signed-in non-admin:** same restrictions; cannot escalate own role; data verified unchanged afterwards.
- **Admin:** full CRUD, sees drafts/inactive, storage upload; cannot write `profiles` from a client.
- **Atomic RPCs:** `save_product` (create/update, images ordering + removed-path reporting, colours, collections, duplicate slug rolls back fully) and `save_collection`; category deletion with reassignment and with cascading product deletion.
- Unpublishing hides a product from the public immediately.

## 3. End-to-end (`tests/e2e`) — 23 tests

**Storefront (fresh catalogue)** — homepage renders with brand/nav/fallback hero and *no console errors*; **no prices anywhere**; no WhatsApp controls until a number is configured; all 11 public routes return 200 with correct headings; 404s for unknown/unpublished slugs; robots/sitemap/OG image/manifest/icon; contact form validation + stored enquiry; empty search; `/admin/*` redirects to login, no sign-up option; anonymous API writes refused (401/403) incl. storage upload.

**Admin (serial, against the running app)**
1. Wrong password rejected; **viewer account blocked** from every admin page.
2. Admin login → dashboard statistics.
3. Settings: invalid WhatsApp number rejected; saving updates the announcement bar, floating WhatsApp link, footer Instagram/email **on the public site**.
4. Category CRUD with **image upload**, duplicate-slug error, edit reflected on the public category page.
5. Product: validation errors; create with **2 uploaded images**, alt text, re-ordering, colours, SKU, flags; publish → appears in Fabrics, New Arrivals, Featured on homepage; detail page shows SKU, weave, description paragraphs, colours; **WhatsApp link exactly** `https://wa.me/919845012345?text=Hello Poojavi The Label, I am interested in <Product>. Please share more details.` (encoded, new tab); optimised image actually loads; search by SKU and colour.
6. Duplicate SKU rejected; drafts are 404 publicly; unpublish/re-publish from list toggles public visibility.
7. Collections: create with banner, assign product, feature on homepage → visible on `/collections`, collection page and homepage; assignment shown on product edit form.
8. Banners (CTA validation) and Instagram gallery → hero title/CTA and gallery image render on the homepage.
9. Enquiries inbox: submitted message visible; mark read; status filter.
10. Category with products: delete blocked until reassignment chosen; products moved; old category 404.
11. Product delete removes it publicly **and deletes its files from storage**.
12. Sign out ends the session.

**Mobile (Pixel 7)** — no horizontal scrolling on 8 storefront pages and 4 admin pages; mobile menu and search work; key touch targets ≥ 44 px; admin drawer navigation.

## 4. Visual review
`VISUAL=1 npm run test:e2e -- --grep @visual` seeds a sample catalogue and captures desktop and mobile screenshots of the homepage, listings, product page, story, contact and admin screens into `visual-review/`. These were reviewed during development (one collapsed-tile layout bug and a scroll-animation visibility issue were found and fixed this way).

## 5. Manual smoke test on your Supabase project (≈10 minutes)
1. Run migrations; create the admin user (README §4); disable public sign-ups.
2. Sign in at `/admin/login`; set WhatsApp number in Settings; tap *Test this WhatsApp link* on a phone.
3. Create a category with an image, a product with 2–3 images, publish it; open it on the site and press *Enquire on WhatsApp* on iPhone and Android.
4. Create a collection, a banner and an Instagram image; check the homepage.
5. Submit the contact form in a private window; confirm it appears in Enquiries.
6. In a private window, confirm `/admin` redirects to login and that a draft product URL returns 404.
