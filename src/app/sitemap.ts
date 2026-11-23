import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { policyPages } from "@/lib/brand";
import { getSitemapEntries } from "@/lib/data/public";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl;
  const { products, categories, collections } = await getSitemapEntries();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/fabrics`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/sarees`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/collections`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/new-arrivals`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/our-story`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.5 },
    ...policyPages.map((p) => ({ url: `${base}/policies/${p.slug}`, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
  return [
    ...staticRoutes,
    ...categories.map((c) => ({ url: `${base}/category/${c.slug}`, lastModified: c.updated_at, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...collections.map((c) => ({ url: `${base}/collections/${c.slug}`, lastModified: c.updated_at, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updated_at, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
