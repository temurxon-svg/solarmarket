import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { fmtUzs } from "@/lib/i18n-text";
import { FavoriteButton } from "@/components/FavoriteButton";
export default async function Favorites({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; const t = await getTranslations("account");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: favs } = await supabase.from("favorites").select("listing_id").eq("user_id", user!.id);
  const ids = (favs ?? []).map((f) => f.listing_id);
  const { data: offers } = ids.length ? await supabase.from("v_product_offers").select("*").in("listing_id", ids) : { data: [] };
  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("favorites")}</h1>
      <table className="table mt-4"><tbody>
        {offers?.map((o) => (<tr key={o.listing_id}><td><Link href={`/product/${o.product_id}`} className="font-medium hover:underline">{o.brand_name} {o.product_model}</Link><div className="text-xs text-ink-2">{o.company_name}</div></td>
          <td className="tnum">{fmtUzs(o.price_uzs, locale)}</td><td><span className="chip">{o.availability}</span></td><td><FavoriteButton listingId={o.listing_id} active /></td></tr>))}
        {!offers?.length && <tr><td className="text-ink-2">—</td></tr>}
      </tbody></table>
    </div>
  );
}
