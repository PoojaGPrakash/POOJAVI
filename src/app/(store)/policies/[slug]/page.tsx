import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Prose } from "@/components/ui/Prose";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSiteSettings } from "@/lib/data/public";
import { policyPages } from "@/lib/brand";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return policyPages.map((p) => ({ slug: p.slug }));
}

function findPolicy(slug: string) {
  return policyPages.find((p) => p.slug === slug) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const policy = findPolicy((await params).slug);
  if (!policy) return { title: "Not found" };
  return { title: policy.label, alternates: { canonical: `/policies/${policy.slug}` } };
}

export default async function PolicyPage({ params }: Props) {
  const policy = findPolicy((await params).slug);
  if (!policy) notFound();
  const settings = await getSiteSettings();
  const text = settings[policy.field];
  return (
    <>
      <PageHeader eyebrow="Policies" title={policy.label} crumbs={[{ label: policy.label }]} />
      <article className="container-luxe max-w-3xl pb-24">
        {text ? <Prose text={text} /> : <EmptyState title="This policy is being updated" description="Please contact us for details." actionHref="/contact" actionLabel="Contact us" />}
        {text && settings.updated_at !== new Date(0).toISOString() && (
          <p className="mt-12 border-t border-line pt-6 text-xs tracking-[0.16em] text-muted uppercase">Last updated {formatDate(settings.updated_at)}</p>
        )}
      </article>
    </>
  );
}
