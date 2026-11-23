import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.fullName,
    short_name: "Poojavi",
    description: `${brand.fullName} — ${brand.tagline}`,
    start_url: "/",
    display: "standalone",
    background_color: "#F8F5EF",
    theme_color: "#551F32",
    icons: [
      { src: "/brand/poojavi-monogram-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/poojavi-monogram-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
