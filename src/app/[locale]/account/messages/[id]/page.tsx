import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { ChatWindow } from "@/components/ChatWindow";
export default async function Conversation({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: c } = await supabase.from("conversations").select("id, buyer_id, company_id, companies(name, slug), orders(id, order_no), listings(products(id, model, brands(name)))").eq("id", id).single();
  if (!c) return <p>Not found.</p>;
  const { data: messages } = await supabase.from("messages").select("id, body, sender_id, created_at, is_internal, profiles(full_name)").eq("conversation_id", id).order("created_at");
  const { data: member } = await supabase.from("company_members").select("role").eq("company_id", c.company_id).eq("user_id", user!.id).maybeSingle();
  const co = c.companies as unknown as { name: string; slug: string }; const o = c.orders as unknown as { id: string; order_no: string } | null; const l = c.listings as unknown as { products: { id: string; model: string; brands: { name: string } } } | null;
  return (
    <div className="flex h-[70vh] max-w-3xl flex-col">
      <div className="border-b border-line pb-2 text-sm">
        <b>{co.name}</b>
        {o && <> · <Link href={`/account/orders/${o.id}`} className="underline tnum">{o.order_no}</Link></>}
        {l && <> · <Link href={`/product/${l.products.id}`} className="underline">{l.products.brands?.name} {l.products.model}</Link></>}
      </div>
      <ChatWindow conversationId={id} userId={user!.id} isSeller={!!member} initial={(messages ?? []).map((m) => ({ id: m.id, body: m.body, sender_id: m.sender_id, created_at: m.created_at, is_internal: m.is_internal, name: (m.profiles as unknown as { full_name: string })?.full_name }))} />
    </div>
  );
}
