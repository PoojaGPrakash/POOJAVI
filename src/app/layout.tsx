import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { env } from "@/lib/env";
import { brand } from "@/lib/brand";
import "./globals.css";

const cormorant = localFont({
  src: [
    { path: "./fonts/cormorant-garamond-latin-wght-normal.woff2", style: "normal", weight: "300 700" },
    { path: "./fonts/cormorant-garamond-latin-wght-italic.woff2", style: "italic", weight: "300 700" },
  ],
  variable: "--font-cormorant",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const jost = localFont({
  src: [{ path: "./fonts/jost-latin-wght-normal.woff2", style: "normal", weight: "100 900" }],
  variable: "--font-jost",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: `${brand.fullName} — Premium Indian Fabrics & Sarees`,
    template: `%s | ${brand.fullName}`,
  },
  description: `${brand.fullName} — a curated house of premium Indian fabrics, sarees and ethnic fashion. ${brand.tagline}.`,
  applicationName: brand.fullName,
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: { siteName: brand.fullName, type: "website", locale: "en_IN" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#F8F5EF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${jost.variable}`}>
      <body className="flex min-h-svh flex-col">{children}</body>
    </html>
  );
}
