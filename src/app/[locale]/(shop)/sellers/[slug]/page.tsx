import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { fmtUzs, t as tx } from "@/lib/i18n-text";
export default async function SellerPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const supabase = await createClient();
  const { data: c } = await supabase.from("companies").select("*").eq("slug", slug).single();
  if (!c) return <p>Not found.</p>;
  const { data: listings } = await supabase.from("v_product_offers").select("*").eq("company_id", c.id).order("price_uzs");
  return (
    <div>
      <h1 className="text-2xl font-semibold">{c.name}</h1>
      <p className="text-ink-2">{c.region} · {c.phone} {c.status === "verified" && <span className="chip chip-ok">✓</span>}</p>
      <p className="mt-3 max-w-2xl">{tx(c.description, locale)}</p>
      <table className="table mt-8"><tbody>
        {listings?.map((l) => (
          <tr key={l.listing_id}><td><Link href={`/product/${l.product_id}`} className="hover:underline">{l.brand_name} {l.product_model}</Link></td><td className="tnum font-medium">{fmtUzs(l.price_uzs, locale)}</td><td className="text-ink-2">{l.availability}</td></tr>
        ))}
      </tbody></table>
    </div>
  );
}
