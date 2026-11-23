import type { NextConfig } from "next";

/**
 * Images uploaded through the admin dashboard are stored in Supabase Storage
 * and served from `<project>.supabase.co/storage/v1/object/public/**`.
 * We derive the allowed host from the environment so no host is hardcoded.
 */
function supabaseImagePattern(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];
  try {
    const url = new URL(raw);
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allows the e2e suite to build into a separate folder (scripts/e2e.sh).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  images: {
    remotePatterns: supabaseImagePattern(),
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    // TEST-ONLY escape hatch used by scripts/e2e.sh where images are served
    // from 127.0.0.1. Never set NEXT_ALLOW_LOCAL_IMAGES in production.
    dangerouslyAllowLocalIP: process.env.NEXT_ALLOW_LOCAL_IMAGES === "1",
  },
  experimental: {
    serverActions: {
      // Images are uploaded directly from the browser to Supabase Storage,
      // so server actions only ever receive small JSON payloads.
      bodySizeLimit: "1mb",
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
