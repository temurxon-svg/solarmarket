import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { t as tx, fmtUzs } from "@/lib/i18n-text";
import { CompareButton } from "@/components/CompareButton";

export default async function CategoryPage({ params, searchParams }: {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<{ q?: string; brand?: string; min?: string; max?: string }>;
}) {
  const { locale, category } = await params;
  const { q, brand, min, max } = await searchParams;
  const t = await getTranslations("catalog");
  const supabase = await createClient();

  const { data: categories } = await supabase.from("categories").select("id, slug, name").order("sort_order");
  const cat = categories?.find((c) => c.slug === category);
  if (!cat) return <p>Category not found.</p>;

  const powerCol = category === "inverter" ? "rated_kw" : category === "battery" ? "capacity_kwh" : "power_w";
  const unit = category === "inverter" ? "kW" : category === "battery" ? "kWh" : "W";

  let query = supabase.from("v_product_price_summary").select("*").eq("category_id", cat.id).order(powerCol, { ascending: true });
  if (q) query = query.ilike("model", `%${q}%`);
  if (brand) query = query.eq("brand_id", Number(brand));
  if (min) query = query.gte(powerCol, Number(min));
  if (max) query = query.lte(powerCol, Number(max));
  const { data: products } = await query;
  const { data: brands } = await supabase.from("brands").select("id, name").order("name");

  return (
    <div>
      <nav className="mb-4 flex flex-wrap gap-2 text-sm">
        {categories?.map((c) => (
          <Link key={c.id} href={`/catalog/${c.slug}`} className={`chip ${c.slug === category ? "bg-ink text-white" : ""}`}>{tx(c.name, locale, c.slug)}</Link>
        ))}
      </nav>
      <h1 className="text-2xl font-semibold">{tx(cat.name, locale)}</h1>

      <form className="mt-4 flex flex-wrap items-end gap-3 text-sm">
        <label>{t("filterBrand")}<br />
          <select name="brand" defaultValue={brand ?? ""} className="input">
            <option value="">{t("all")}</option>
            {brands?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
        <label>{t("filterPower")} {unit}<br /><input name="min" defaultValue={min} className="input w-24" placeholder="min" /></label>
        <label>&nbsp;<br /><input name="max" defaultValue={max} className="input w-24" placeholder="max" /></label>
        <input type="hidden" name="q" value={q ?? ""} />
        <button className="btn" type="submit">OK</button>
      </form>

      <table className="table mt-6">
        <thead><tr>
          <th>{t("filterBrand")}</th><th>Model</th><th className="tnum">{unit}</th><th className="tnum">{t("from")}</th><th></th><th></th>
        </tr></thead>
        <tbody>
          {(products ?? []).map((p) => (
            <tr key={p.product_id}>
              <td>{p.brand_name}</td>
              <td><Link href={`/product/${p.product_id}`} className="font-medium hover:underline">{p.model}</Link></td>
              <td className="tnum">{p[powerCol] ?? "—"}</td>
              <td className="tnum">{p.min_price_uzs ? fmtUzs(p.min_price_uzs, locale) : <span className="text-ink-2">{t("noOffers")}</span>}</td>
              <td className="text-sm text-ink-2 tnum">{p.seller_count} {t("offers")}</td>
              <td><CompareButton id={p.product_id} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
