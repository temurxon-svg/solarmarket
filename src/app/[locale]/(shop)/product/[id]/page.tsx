import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { t as tx, fmtUzs } from "@/lib/i18n-text";
import { CompareButton } from "@/components/CompareButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { PriceHistory } from "@/components/PriceHistory";
import { startConversation } from "@/lib/actions/buyer";

export default async function ProductPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<{ qty?: string }> }) {
  const { locale, id } = await params;
  const { qty: qtyS } = await searchParams;
  const qty = Math.max(1, Number(qtyS || 1));
  const t = await getTranslations("product"); const ta = await getTranslations("account");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: p } = await supabase.from("products").select("*, brands(name), categories(slug, name, spec_schema)").eq("id", id).single();
  if (!p) return <p>Not found.</p>;
  const [{ data: offers }, { data: favs }, { data: fin }] = await Promise.all([
    supabase.from("v_product_offers").select("*").eq("product_id", id).order("price_uzs", { ascending: true, nullsFirst: false }),
    user ? supabase.from("favorites").select("listing_id").eq("user_id", user.id) : Promise.resolve({ data: [] as { listing_id: string }[] }),
    supabase.from("financing_offers").select("*").eq("active", true).order("annual_rate_pct").limit(1).maybeSingle(),
  ]);
  const favSet = new Set((favs ?? []).map((f) => f.listing_id));
  // tier prices at requested qty
  const ids = (offers ?? []).map((o) => o.listing_id);
  const { data: tiers } = ids.length ? await supabase.from("listing_price_tiers").select("listing_id, min_qty, price_uzs").in("listing_id", ids).lte("min_qty", qty).order("min_qty", { ascending: false }) : { data: [] as { listing_id: string; min_qty: number; price_uzs: number }[] };
  const tierPrice = (lid: string) => tiers?.find((x) => x.listing_id === lid)?.price_uzs;
  const rows = (offers ?? []).map((o) => ({ ...o, eff: o.price_uzs == null ? null : (tierPrice(o.listing_id) ?? o.price_uzs) })).sort((a, b) => (a.eff ?? 1e15) - (b.eff ?? 1e15));
  const best = rows.find((o) => o.eff != null)?.listing_id;
  const bestPrice = rows.find((o) => o.eff != null)?.eff ?? null;
  // price history (min per week across sellers)
  const { data: hist } = ids.length ? await supabase.from("price_history").select("price_uzs, recorded_at").in("listing_id", ids).order("recorded_at") : { data: [] as { price_uzs: number; recorded_at: string }[] };
  const byWeek = new Map<string, number>();
  (hist ?? []).forEach((h) => { const k = h.recorded_at.slice(0, 10); byWeek.set(k, Math.min(byWeek.get(k) ?? Infinity, Number(h.price_uzs))); });
  const points = [...byWeek.entries()].sort().map(([d, v]) => ({ d: d.slice(5), v }));
  const schema = (p.categories?.spec_schema ?? []) as { key: string; label: Record<string, string>; unit?: string }[];
  const avail: Record<string, [string, string]> = { in_stock: [t("inStock"), "chip-ok"], in_transit: [t("inTransit"), "chip-warn"], pre_order: [t("preOrder"), ""], on_request: [t("onRequest"), ""] };
  const monthly = (total: number) => { if (!fin) return null; const r = fin.annual_rate_pct / 1200, n = fin.term_months_max ?? 36, pv = total * (1 - (fin.down_payment_pct ?? 0) / 100); return pv * r / (1 - Math.pow(1 + r, -n)); };

  return (
    <div>
      <p className="text-sm text-ink-2"><Link href={`/catalog/${p.categories?.slug}`}>{tx(p.categories?.name, locale)}</Link> / {p.brands?.name}</p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">{p.brands?.name} {p.model}</h1>
        <div className="flex items-center gap-2">
          <form className="flex items-center gap-2 text-sm"><label>{ta("qty")}</label><input name="qty" type="number" min={1} defaultValue={qty} className="input w-24 tnum" /><button className="btn text-xs">OK</button></form>
          <CompareButton id={p.id} />
        </div>
      </div>
      {bestPrice != null && fin && <p className="mt-2 text-sm text-ink-2">{ta("financing")}: {fmtUzs(monthly(bestPrice * qty), locale)} {ta("perMonth")} · {fin.provider_name}, {fin.annual_rate_pct}% · {fin.term_months_max} {locale === "en" ? "mo" : locale === "ru" ? "мес." : "oy"}</p>}

      <h2 className="mt-8 mb-2 font-medium">{t("offers")} {qty > 1 && <span className="text-sm text-ink-2">· {qty} {t("qty").toLowerCase()}</span>}</h2>
      <table className="table">
        <thead><tr><th>{t("seller")}</th><th className="tnum">{t("price")}</th><th className="tnum">{t("qty")}</th><th>{t("availability")}</th><th>{t("warranty")}</th><th>{t("updated")}</th><th></th></tr></thead>
        <tbody>
          {rows.map((o) => {
            const [label, cls] = avail[o.availability] ?? [o.availability, ""];
            const stale = Date.now() - new Date(o.price_updated_at).getTime() > 30 * 864e5;
            return (
              <tr key={o.listing_id} className={o.listing_id === best ? "best" : ""}>
                <td><Link href={`/sellers/${o.company_slug}`} className="font-medium hover:underline">{o.company_name}</Link>
                  {o.company_status === "verified" && <span className="chip chip-ok ml-2">✓</span>}
                  <div className="text-xs text-ink-2">{o.region} · ★ {o.rating_avg} ({o.rating_count})</div></td>
                <td className="tnum">
                  {o.eff != null ? <>
                    <div className="font-semibold">{fmtUzs(o.eff, locale)}</div>
                    {o.eff !== o.price_uzs && <div className="text-xs text-ink-2 line-through">{fmtUzs(o.price_uzs, locale)}</div>}
                    {o.currency === "USD" && <div className="text-xs text-ink-2">${o.price}</div>}
                    {p.power_w && <div className="text-xs text-ink-2">{Math.round(o.eff / p.power_w)} UZS/W</div>}
                  </> : <span className="chip">{o.price_visibility === "dealers_only" ? t("dealersOnly") : t("onRequest")}</span>}
                  {o.listing_id === best && <div className="text-xs text-amber-dark">{t("best")}</div>}
                </td>
                <td className="tnum">{o.min_order_qty} {o.unit}</td>
                <td><span className={`chip ${cls}`}>{label}</span>{o.stock_location && <div className="text-xs text-ink-2">{o.stock_location}</div>}{o.eta_date && <div className="text-xs text-ink-2">ETA {o.eta_date}</div>}</td>
                <td className="tnum">{o.warranty_months ? `${o.warranty_months} ${t("months")}` : "—"}</td>
                <td className={`text-xs ${stale ? "text-warn" : "text-ink-2"}`}>{new Date(o.price_updated_at).toLocaleDateString(locale === "en" ? "en-GB" : "ru-RU")}</td>
                <td className="whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Link href={`/account/orders/new?listing=${o.listing_id}&qty=${qty}`} className="btn btn-primary text-xs">{t("rfq")}</Link>
                    <form action={startConversation.bind(null, locale, o.company_id, o.listing_id)}><button className="btn text-xs">{t("chat")}</button></form>
                    <FavoriteButton listingId={o.listing_id} active={favSet.has(o.listing_id)} />
                  </div>
                </td>
              </tr>);
          })}
          {!rows.length && <tr><td colSpan={7} className="text-ink-2">—</td></tr>}
        </tbody>
      </table>

      {points.length > 1 && <><h2 className="mt-10 mb-2 font-medium">{ta("history")}</h2><PriceHistory points={points} locale={locale} /></>}

      <h2 className="mt-10 mb-2 font-medium">{t("specs")}</h2>
      <table className="table max-w-xl"><tbody>
        {schema.map((s) => (p.specs?.[s.key] != null) && (
          <tr key={s.key}><td className="text-ink-2">{tx(s.label, locale, s.key)}</td><td className="tnum">{typeof p.specs[s.key] === "boolean" ? (p.specs[s.key] ? "✓" : "—") : String(p.specs[s.key])} {s.unit ?? ""}</td></tr>))}
      </tbody></table>
      {p.datasheet_url && <a href={p.datasheet_url} className="btn mt-4" target="_blank">Datasheet (PDF)</a>}
    </div>
  );
}
