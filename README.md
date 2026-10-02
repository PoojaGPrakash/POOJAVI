# POOJAVI — Wear a Story

Premium textile catalogue with WhatsApp enquiry/purchase flow.

## What is included
- Editorial, mobile-first storefront
- Collections and product detail pages
- No public prices and no online checkout
- WhatsApp enquiry links with pre-filled product messages
- `/admin` catalogue studio
- Admin can create collections, upload collection covers, create products and upload product images
- Vercel Blob persistence for the catalogue and images

## Vercel setup
1. Create a Vercel Blob store in the `poojavi` project.
2. Add these environment variables:
   - `BLOB_READ_WRITE_TOKEN`
   - `POOJAVI_ADMIN_PASSWORD`
   - `POOJAVI_ADMIN_SECRET`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` (digits only, international format)
3. Redeploy.
4. Open `/admin` and publish collections/products.

The app falls back to a demo catalogue when Blob is not configured, so the storefront can still build successfully.
