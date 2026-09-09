"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { readCompare, writeCompare } from "./CompareButton";
import { t as tx, fmtUzs } from "@/lib/i18n-text";
import { Link } from "@/i18n/navigation";

type Row = Record<string, unknown> & { product_id: string; model: string; specs?: Record<string, unknown>; min_price_uzs: number | null; seller_count: number; brands?: { name: string }; categories?: { spec_schema: { key: string; label: Record<string, string>; unit?: string; comparable?: boolean }[] } };

export function CompareView({ locale }: { locale: string }) {
  const t = useTranslations("compare");
  const [rows, setRows] = useState<Row[]>([]);
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const current = readCompare(); setIds(current);
      if (!current.length) { setRows([]); return; }
      const supabase = createClient();
      const { data } = await supabase.from("products").select("id, model, specs, category_id, brands(name), categories(spec_schema)").in("id", current);
      const { data: prices } = await supabase.from("v_product_price_summary").select("product_id, min_price_uzs, seller_count").in("product_id", current);
      setRows((data ?? []).map((d) => {
        const id = (d as { id: string }).id;
        const price = prices?.find((p) => p.product_id === id);
        return { ...(d as unknown as Omit<Row, "product_id">), product_id: id, min_price_uzs: price?.min_price_uzs ?? null, seller_count: price?.seller_count ?? 0 } as Row;
      }));
    };
    load(); window.addEventListener("sm_compare", load); return () => window.removeEventListener("sm_compare", load);
  }, []);

  if (!ids.length) return <div><h1 className="text-2xl font-semibold">{t("title")}</h1><p className="mt-4 text-ink-2">{t("empty")}</p></div>;
  const schema = rows[0]?.categories?.spec_schema?.filter((s) => s.comparable !== false) ?? [];
  const bestPrice = Math.min(...rows.map((r) => r.min_price_uzs ?? Infinity));

  return (
    <div>
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">{t("title")}</h1><button className="btn" onClick={() => writeCompare([])}>{t("clear")}</button></div>
      <div className="mt-6 overflow-x-auto">
        <table className="table">
          <thead><tr><th></th>{rows.map((r) => <th key={r.product_id}><Link href={`/product/${r.product_id}`} className="text-ink hover:underline">{r.brands?.name} {r.model}</Link></th>)}</tr></thead>
          <tbody>
            <tr><td className="text-ink-2">{t("bestPrice")}</td>{rows.map((r) => <td key={r.product_id} className={`tnum font-semibold ${r.min_price_uzs === bestPrice ? "text-amber-dark" : ""}`}>{fmtUzs(r.min_price_uzs, locale)}<div className="text-xs font-normal text-ink-2">{r.seller_count} sellers</div></td>)}</tr>
            {schema.map((s) => (
              <tr key={s.key}><td className="text-ink-2">{tx(s.label, locale, s.key)}</td>{rows.map((r) => <td key={r.product_id} className="tnum">{r.specs?.[s.key] != null ? `${String(r.specs[s.key])} ${s.unit ?? ""}` : "—"}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
