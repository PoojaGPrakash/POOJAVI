import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdminPage } from "@/lib/auth";
import { getProduct, listCategoryOptions, listCollectionOptions } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Edit product" };

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdminPage();
  const [product, categories, collections] = await Promise.all([getProduct(supabase, id), listCategoryOptions(supabase), listCollectionOptions(supabase)]);
  if (!product) notFound();
  return (
    <>
      <AdminPageHeader
        title={product.name}
        description={product.status === "published" ? "Published — visible on the website." : "Draft — not visible on the website."}
        back={{ href: "/admin/products", label: "Products" }}
        action={
          product.status === "published" ? (
            <Link href={`/products/${product.slug}`} target="_blank" className="btn-outline">
              <ExternalLink className="h-4 w-4" /> View on site
            </Link>
          ) : undefined
        }
      />
      <ProductForm product={product} categories={categories} collections={collections} />
    </>
  );
}
