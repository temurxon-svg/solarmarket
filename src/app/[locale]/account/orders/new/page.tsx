import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/actions/buyer";
import { fmtUzs } from "@/lib/i18n-text";
export default async function NewOrder({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ listing?: string; qty?: string }> }) {
  const { locale } = await params; const { listing, qty } = await searchParams;
  const t = await getTranslations("account");
  const supabase = await createClient();
  const { data: l } = await supabase.from("v_product_offers").select("*").eq("listing_id", listing!).single();
  if (!l) return <p>Listing not found.</p>;
  const { data: regions } = await supabase.from("regions").select("code, name").order("code");
  const q = Math.max(l.min_order_qty, Number(qty || l.min_order_qty));
  const { data: eff } = await supabase.rpc("effective_price_uzs", { p_listing: listing, p_qty: q });
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">{t("newOrder")}</h1>
      <div className="mt-4 rounded border border-line p-4 text-sm">
        <div className="font-medium">{l.brand_name} {l.product_model}</div>
        <div className="text-ink-2">{l.company_name} · {l.price_uzs != null ? `${fmtUzs(eff ?? l.price_uzs, locale)} / ${l.unit}` : "price on request"} · min {l.min_order_qty} {l.unit}</div>
      </div>
      <form action={createOrder.bind(null, locale)} className="mt-6 space-y-4 text-sm">
        <input type="hidden" name="listing_id" value={l.listing_id} />
        <div className="grid grid-cols-2 gap-3">
          <label>{t("qty")} *<input name="qty" type="number" min={l.min_order_qty} defaultValue={q} required className="input tnum" /></label>
          <label>{t("region")}<select name="region" className="input">{regions?.map((r) => <option key={r.code} value={(r.name as Record<string,string>).uz}>{(r.name as Record<string, string>)[locale] ?? (r.name as Record<string,string>).uz}</option>)}</select></label>
          <label className="col-span-2">{t("address")}<input name="address" className="input" /></label>
          <label>{t("prepay")}<input name="prepayment_pct" type="number" defaultValue={100} min={0} max={100} className="input tnum" /></label>
          <label>{t("deferred")}<input name="deferred_days" type="number" defaultValue={0} min={0} className="input tnum" /></label>
          <label>Expected date<input name="expected_date" type="date" className="input" /></label>
          <label>PO number<input name="po_number" className="input" /></label>
        </div>
        <label className="block">{t("note")}<textarea name="note" rows={3} className="input" /></label>
        <button className="btn btn-primary">{t("send")}</button>
      </form>
    </div>
  );
}
