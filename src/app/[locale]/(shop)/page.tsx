import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { t as tx, fmtUzs } from "@/lib/i18n-text";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const supabase = await createClient();
  const [{ data: categories }, { count: productCount }, { data: sellers }, { data: panels }, { data: inverters }, { data: batteries }] = await Promise.all([
    supabase.from("categories").select("id, slug, name").order("sort_order"),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("companies").select("id, slug, name, region, rating_avg, rating_count").eq("status", "verified").order("rating_count", { ascending: false }).limit(6),
    supabase.from("v_product_price_summary").select("product_id, brand_name, model, power_w, min_price_uzs, seller_count").not("min_price_uzs", "is", null).not("power_w", "is", null).order("min_price_uzs").limit(40),
    supabase.from("v_product_price_summary").select("product_id, brand_name, model, rated_kw, inverter_type, min_price_uzs, seller_count").not("min_price_uzs", "is", null).not("rated_kw", "is", null).order("min_price_uzs").limit(40),
    supabase.from("v_product_price_summary").select("product_id, brand_name, model, capacity_kwh, min_price_uzs, seller_count").not("min_price_uzs", "is", null).not("capacity_kwh", "is", null).order("min_price_uzs").limit(40),
  ]);
  const { count: listingCount } = await supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active");
  const bestPerW = [...(panels ?? [])].sort((a, b) => a.min_price_uzs / a.power_w - b.min_price_uzs / b.power_w).slice(0, 5);
  const bestKw = [...(inverters ?? [])].sort((a, b) => a.min_price_uzs / a.rated_kw - b.min_price_uzs / b.rated_kw).slice(0, 5);
  const bestKwh = [...(batteries ?? [])].sort((a, b) => a.min_price_uzs / a.capacity_kwh - b.min_price_uzs / b.capacity_kwh).slice(0, 5);
  const Col = ({ title, rows, unit, per }: { title: string; rows: typeof bestPerW; unit: string; per: (r: typeof bestPerW[number]) => number }) => (
    <div>
      <h3 className="mb-2 text-sm font-medium text-ink-2">{title}</h3>
      <table className="table"><tbody>{rows.map((r) => (
        <tr key={r.product_id}><td><Link href={`/product/${r.product_id}`} className="hover:underline">{r.brand_name} <span className="text-ink-2">{r.model}</span></Link></td>
          <td className="tnum text-right"><b>{Math.round(per(r)).toLocaleString("ru-RU")}</b> <span className="text-xs text-ink-2">{unit}</span><div className="text-xs text-ink-2">{fmtUzs(r.min_price_uzs, locale)} · {r.seller_count}</div></td></tr>))}</tbody></table>
    </div>);

  return (
    <div>
      <section className="grid items-start gap-8 py-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <h1 className="text-3xl font-semibold leading-tight">{t("title")}</h1>
          <p className="mt-3 text-ink-2">{t("subtitle")}</p>
          <form action={`/${locale}/catalog`} className="mt-6 flex gap-2">
            <input name="q" className="input" placeholder={t("search")} />
            <button className="btn btn-primary" type="submit">→</button>
          </form>
          <p className="mt-3 text-sm text-ink-2 tnum">{productCount ?? 0} {t("products")} · {listingCount ?? 0} {locale === "en" ? "offers" : locale === "ru" ? "предложений" : "taklif"} · {sellers?.length ?? 0}+ {t("sellers")}</p>
        </div>
        <div className="rounded border border-line p-4 text-sm">
          <h2 className="mb-3 font-medium">{t("how")}</h2>
          <ol className="space-y-2 text-ink-2"><li><span className="text-amber-dark tnum">1</span> {t("how1")}</li><li><span className="text-amber-dark tnum">2</span> {t("how2")}</li><li><span className="text-amber-dark tnum">3</span> {t("how3")}</li></ol>
        </div>
      </section>

      <section className="mt-2">
        <h2 className="mb-3 font-medium">{t("categories")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(categories ?? []).map((c) => <Link key={c.id} href={`/catalog/${c.slug}`} className="rounded border border-line px-4 py-5 hover:bg-pale">{tx(c.name, locale, c.slug)}</Link>)}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 font-medium">{t("pricesTitle")}</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <Col title={tx(categories?.find((c) => c.slug === "panel")?.name, locale)} rows={bestPerW} unit={t("perW")} per={(r) => r.min_price_uzs / r.power_w} />
          <Col title={tx(categories?.find((c) => c.slug === "inverter")?.name, locale)} rows={bestKw as unknown as typeof bestPerW} unit="UZS/kW" per={(r) => r.min_price_uzs / (r as unknown as { rated_kw: number }).rated_kw} />
          <Col title={tx(categories?.find((c) => c.slug === "battery")?.name, locale)} rows={bestKwh as unknown as typeof bestPerW} unit="UZS/kWh" per={(r) => r.min_price_uzs / (r as unknown as { capacity_kwh: number }).capacity_kwh} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 font-medium">{t("sellersTitle")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sellers?.map((s) => <Link key={s.id} href={`/sellers/${s.slug}`} className="rounded border border-line p-4 hover:bg-pale"><div className="font-medium">{s.name} <span className="chip chip-ok">✓</span></div><div className="text-sm text-ink-2">{s.region} · ★ {s.rating_avg} ({s.rating_count})</div></Link>)}
        </div>
      </section>
    </div>
  );
}
