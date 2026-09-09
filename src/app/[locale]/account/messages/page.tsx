import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
export default async function Messages() {
  const t = await getTranslations("account");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: convs } = await supabase.from("conversations").select("id, last_message_at, buyer_id, companies(name), orders(order_no), listings(products(model, brands(name))), messages(body, created_at, sender_id)").order("last_message_at", { ascending: false }).limit(50);
  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("messages")}</h1>
      <ul className="mt-4 divide-y divide-line">
        {convs?.map((c) => { const msgs = (c.messages as unknown as { body: string; created_at: string; sender_id: string }[]).sort((a, b) => b.created_at.localeCompare(a.created_at)); const last = msgs[0]; const l = c.listings as unknown as { products: { model: string; brands: { name: string } } } | null; return (
          <li key={c.id}><Link href={`/account/messages/${c.id}`} className="block py-3 hover:bg-pale">
            <div className="flex justify-between text-sm"><b>{c.buyer_id === user?.id ? (c.companies as unknown as { name: string })?.name : "Buyer"}</b><span className="text-xs text-ink-2">{c.last_message_at && new Date(c.last_message_at).toLocaleString("ru-RU")}</span></div>
            <div className="text-xs text-ink-2">{(c.orders as unknown as { order_no: string })?.order_no} {l && `${l.products?.brands?.name} ${l.products?.model}`}</div>
            <div className="truncate text-sm text-ink-2">{last?.body ?? "—"}</div></Link></li>); })}
        {!convs?.length && <li className="py-3 text-ink-2">{t("noMessages")}</li>}
      </ul>
    </div>
  );
}
