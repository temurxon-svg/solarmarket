import { createClient } from "@/lib/supabase/server";
import { CatalogRequestForm } from "@/components/CatalogRequestForm";
import { requestProduct } from "@/lib/actions/company";
export default async function CatalogRequest({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const [{ data: categories }, { data: brands }] = await Promise.all([
    supabase.from("categories").select("id, slug, name, spec_schema").order("sort_order"),
    supabase.from("brands").select("id, slug, name").order("name"),
  ]);
  return <div><h1 className="mb-1 text-2xl font-semibold">Request a new catalog product</h1>
    <p className="mb-6 text-sm text-ink-2">Upload the manufacturer datasheet and the fields fill automatically, or enter manually. Admin approves before it appears in the catalog.</p>
    <CatalogRequestForm locale={locale} categories={categories ?? []} brands={brands ?? []} action={requestProduct.bind(null, locale)} /></div>;
}
