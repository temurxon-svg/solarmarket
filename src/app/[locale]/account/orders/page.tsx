import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { fmtUzs } from "@/lib/i18n-text";
export default async function Orders({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; const t = await getTranslations("account");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: orders } = await supabase.from("orders").select("id, order_no, status, total_uzs, created_at, companies(name), order_items(qty, products(model, brands(name)))").eq("buyer_id", user!.id).order("created_at", { ascending: false });
  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("orders")}</h1>
      <table className="table mt-4"><thead><tr><th>#</th><th>{t("date")}</th><th>{t("seller")}</th><th>Product</th><th className="tnum">{t("total")}</th><th>{t("status")}</th></tr></thead><tbody>
        {orders?.map((o) => { const it = (o.order_items as unknown as { qty: number; products: { model: string; brands: { name: string } } }[])?.[0]; return (
          <tr key={o.id}><td><Link href={`/account/orders/${o.id}`} className="font-medium hover:underline tnum">{o.order_no}</Link></td>
            <td className="text-ink-2 text-xs">{new Date(o.created_at).toLocaleDateString("ru-RU")}</td>
            <td>{(o.companies as unknown as { name: string })?.name}</td>
            <td>{it?.products?.brands?.name} {it?.products?.model} × {it?.qty}</td>
            <td className="tnum">{fmtUzs(o.total_uzs, locale)}</td><td><span className={`chip ${o.status === "accepted" || o.status === "completed" ? "chip-ok" : o.status === "declined" || o.status === "cancelled" ? "chip-warn" : ""}`}>{o.status}</span></td></tr>); })}
        {!orders?.length && <tr><td colSpan={6} className="text-ink-2">{t("noOrders")}</td></tr>}
      </tbody></table>
    </div>
  );
}
