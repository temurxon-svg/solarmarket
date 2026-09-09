import { createClient } from "@/lib/supabase/server";
import { ListingForm } from "@/components/ListingForm";
import { saveListing } from "@/lib/actions/company";
export default async function EditListing({ params }: { params: Promise<{ locale: string; id: string; listingId: string }> }) {
  const { locale, id, listingId } = await params;
  const supabase = await createClient();
  const { data: l } = await supabase.from("listings").select("*, products(id, model, brands(name))").eq("id", listingId).eq("company_id", id).single();
  if (!l) return <p>Not found.</p>;
  const { data: tiers } = await supabase.from("listing_price_tiers").select("min_qty, price").eq("listing_id", listingId).order("min_qty");
  const p = l.products as unknown as { id: string; model: string; brands: { name: string } };
  return <div><h1 className="mb-6 text-2xl font-semibold">Edit listing</h1>
    <ListingForm l={l} tiers={tiers ?? []} product={{ id: p.id, label: `${p.brands?.name} ${p.model}` }} action={saveListing.bind(null, id, locale)} /></div>;
}
