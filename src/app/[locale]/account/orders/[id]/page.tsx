import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { fmtUzs } from "@/lib/i18n-text";
import { setOrderStatus } from "@/lib/actions/buyer";
import { OrderActions } from "@/components/OrderActions";

export default async function OrderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params; const t = await getTranslations("account");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: o } = await supabase.from("orders").select("*, companies(id, name, slug, phone), order_items(qty, unit_price, line_total, products(model, brands(name))), order_events(id, to_status, note, created_at, profiles(full_name))").eq("id", id).single();
  if (!o) return <p>Not found.</p>;
  const { data: conv } = await supabase.from("conversations").select("id").eq("order_id", id).maybeSingle();
  const isBuyer = o.buyer_id === user?.id;
  const { data: member } = await supabase.from("company_members").select("role").eq("company_id", o.company_id).eq("user_id", user!.id).maybeSingle();
  const c = o.companies as unknown as { id: string; name: string; slug: string; phone: string };
  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold tnum">{o.order_no}</h1>
        <span className={`chip ${["accepted","completed","contract_issued"].includes(o.status) ? "chip-ok" : ["declined","cancelled"].includes(o.status) ? "chip-warn" : ""}`}>{o.status}</span>
      </div>
      <p className="text-sm text-ink-2">{t("seller")}: <Link href={`/sellers/${c.slug}`} className="underline">{c.name}</Link> · {c.phone} · {new Date(o.created_at).toLocaleString("ru-RU")}</p>
      <table className="table"><thead><tr><th>Product</th><th className="tnum">{t("qty")}</th><th className="tnum">Unit</th><th className="tnum">{t("total")}</th></tr></thead><tbody>
        {(o.order_items as unknown as { qty: number; unit_price: number; line_total: number; products: { model: string; brands: { name: string } } }[]).map((it, i) => (
          <tr key={i}><td>{it.products?.brands?.name} {it.products?.model}</td><td className="tnum">{it.qty}</td><td className="tnum">{fmtUzs(it.unit_price, locale)}</td><td className="tnum font-medium">{fmtUzs(it.line_total, locale)}</td></tr>))}
      </tbody></table>
      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div><div className="text-ink-2">{t("prepay")}</div><div className="tnum">{o.prepayment_pct}%</div></div>
        <div><div className="text-ink-2">{t("deferred")}</div><div className="tnum">{o.deferred_days}</div></div>
        <div><div className="text-ink-2">{t("region")}</div><div>{o.delivery_region ?? "—"}</div></div>
        <div><div className="text-ink-2">Quote valid until</div><div className="tnum">{o.quote_valid_until ?? "—"}</div></div>
      </div>
      {o.buyer_note && <p className="text-sm"><span className="text-ink-2">{t("note")}:</span> {o.buyer_note}</p>}
      {o.seller_note && <p className="text-sm"><span className="text-ink-2">Seller:</span> {o.seller_note}</p>}

      <OrderActions orderId={o.id} status={o.status} isBuyer={isBuyer} isSeller={!!member} />
      {conv && <Link href={`/account/messages/${conv.id}`} className="btn">{t("messages")} →</Link>}

      <div><h2 className="mb-2 font-medium">{t("events")}</h2>
        <ul className="space-y-1 text-sm">{(o.order_events as unknown as { id: number; to_status: string; note: string; created_at: string; profiles: { full_name: string } }[]).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((e) => (
          <li key={e.id} className="text-ink-2"><span className="tnum">{new Date(e.created_at).toLocaleString("ru-RU")}</span> · <b className="text-ink">{e.to_status}</b> {e.note && `— ${e.note}`} <span className="text-xs">({e.profiles?.full_name})</span></li>))}</ul></div>
    </div>
  );
}
