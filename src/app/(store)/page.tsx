import { Hero } from "@/components/home/Hero";
import { BrandIntro } from "@/components/home/BrandIntro";
import { CollectionsShowcase, type ShowcaseItem } from "@/components/home/CollectionsShowcase";
import { ProductSection } from "@/components/home/ProductSection";
import { StorySection } from "@/components/home/StorySection";
import { CraftSection } from "@/components/home/CraftSection";
import { InstagramGallery } from "@/components/home/InstagramGallery";
import { WhatsAppSection } from "@/components/home/WhatsAppSection";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getActiveBanners,
  getCategories,
  getCollections,
  getInstagramPosts,
  getProducts,
  getSiteSettings,
} from "@/lib/data/public";
import { normaliseWhatsAppNumber } from "@/lib/whatsapp";
import { env } from "@/lib/env";
import { brand } from "@/lib/brand";

export const revalidate = 300;

export default async function HomePage() {
  const [settings, banners, featuredCollections, categories, fabrics, sarees, newArrivals, instagram] = await Promise.all([
    getSiteSettings(),
    getActiveBanners(),
    getCollections({ featuredOnly: true }),
    getCategories(),
    getProducts({ department: "fabrics", featured: true, limit: 4 }),
    getProducts({ department: "sarees", featured: true, limit: 4 }),
    getProducts({ newArrival: true, limit: 8 }),
    getInstagramPosts(8),
  ]);

  const showcase: ShowcaseItem[] = featuredCollections.length
    ? featuredCollections.map((c) => ({ id: c.id, name: c.name, href: `/collections/${c.slug}`, imagePath: c.banner_path, description: c.description }))
    : categories.map((c) => ({ id: c.id, name: c.name, href: `/category/${c.slug}`, imagePath: c.image_path, description: c.description }));

  const hasCatalogue = fabrics.length + sarees.length + newArrivals.length > 0;

  const organisationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.fullName,
    slogan: brand.tagline,
    url: env.siteUrl,
    logo: `${env.siteUrl}/brand/poojavi-monogram.png`,
    ...(settings.instagram_url ? { sameAs: [settings.instagram_url] } : {}),
    ...(settings.contact_email ? { email: settings.contact_email } : {}),
  };

  return (
    <>
      <Hero banners={banners} />
      <BrandIntro eyebrow={settings.intro_eyebrow} heading={settings.intro_heading} body={settings.intro_body} />
      <CollectionsShowcase items={showcase} />
      <ProductSection eyebrow="Featured" title="Featured Fabrics" products={fabrics} href="/fabrics" hrefLabel="All fabrics" />
      <ProductSection eyebrow="Featured" title="Featured Sarees" products={sarees} href="/sarees" hrefLabel="All sarees" tinted />
      <ProductSection eyebrow="Just in" title="New Arrivals" products={newArrivals} href="/new-arrivals" />
      {!hasCatalogue && (
        <section className="container-luxe py-16">
          <EmptyState
            title="Our new edit is being prepared"
            description="Fresh fabrics and sarees will be unveiled here shortly. Reach out on WhatsApp for a private preview."
          />
        </section>
      )}
      <StorySection heading={settings.story_heading} body={settings.story_body} imagePath={settings.story_image_path} />
      <CraftSection heading={settings.craft_heading} body={settings.craft_body} imagePath={settings.craft_image_path} />
      <InstagramGallery posts={instagram} profileUrl={settings.instagram_url} handle={settings.instagram_handle} />
      <WhatsAppSection hasNumber={Boolean(normaliseWhatsAppNumber(settings.whatsapp_number))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
