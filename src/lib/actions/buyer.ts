"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function toggleFavorite(listingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "login" };
  const { data } = await supabase.from("favorites").select("listing_id").eq("user_id", user.id).eq("listing_id", listingId).maybeSingle();
  if (data) await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", listingId);
  else await supabase.from("favorites").insert({ user_id: user.id, listing_id: listingId });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createOrder(locale: string, fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const listingId = String(fd.get("listing_id"));
  const qty = Math.max(1, Number(fd.get("qty") || 1));
  const { data: l } = await supabase.from("listings").select("id, company_id, product_id, price, currency, price_uzs").eq("id", listingId).single();
  if (!l) throw new Error("Listing not found");
  const { data: unitUzs } = await supabase.rpc("effective_price_uzs", { p_listing: listingId, p_qty: qty });
  const unit = Number(unitUzs ?? l.price_uzs);
  const { data: o, error } = await supabase.from("orders").insert({
    buyer_id: user.id, company_id: l.company_id, status: "sent", currency: "UZS",
    subtotal: unit * qty, total: unit * qty, total_uzs: unit * qty,
    buyer_note: fd.get("note") || null, delivery_region: fd.get("region") || null, delivery_address: fd.get("address") || null,
    prepayment_pct: Number(fd.get("prepayment_pct") || 100), deferred_days: Number(fd.get("deferred_days") || 0),
    expected_date: fd.get("expected_date") || null, po_number: fd.get("po_number") || null,
    quote_valid_until: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
  }).select("id").single();
  if (error) throw new Error(error.message);
  await supabase.from("order_items").insert({ order_id: o.id, listing_id: l.id, product_id: l.product_id, qty, unit_price: unit, currency: "UZS" });
  await supabase.from("order_events").insert({ order_id: o.id, actor_id: user.id, to_status: "sent", note: "RFQ sent" });
  const { data: conv } = await supabase.from("conversations").insert({ buyer_id: user.id, company_id: l.company_id, order_id: o.id, listing_id: l.id, last_message_at: new Date().toISOString() }).select("id").single();
  if (conv && fd.get("note")) await supabase.from("messages").insert({ conversation_id: conv.id, sender_id: user.id, body: String(fd.get("note")) });
  revalidatePath("/", "layout");
  redirect(`/${locale}/account/orders/${o.id}`);
}

export async function setOrderStatus(orderId: string, status: string, note?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: o } = await supabase.from("orders").select("status").eq("id", orderId).single();
  const patch: Record<string, unknown> = { status };
  if (status === "accepted") patch.accepted_at = new Date().toISOString();
  if (status === "completed") patch.completed_at = new Date().toISOString();
  await supabase.from("orders").update(patch).eq("id", orderId);
  await supabase.from("order_events").insert({ order_id: orderId, actor_id: user.id, from_status: o?.status, to_status: status, note: note || null });
  revalidatePath("/", "layout");
}

export async function startConversation(locale: string, companyId: string, listingId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  let q = supabase.from("conversations").select("id").eq("buyer_id", user.id).eq("company_id", companyId).is("order_id", null);
  q = listingId ? q.eq("listing_id", listingId) : q.is("listing_id", null);
  const { data: existing } = await q.maybeSingle();
  if (existing) redirect(`/${locale}/account/messages/${existing.id}`);
  const { data: c, error } = await supabase.from("conversations").insert({ buyer_id: user.id, company_id: companyId, listing_id: listingId ?? null, last_message_at: new Date().toISOString() }).select("id").single();
  if (error) throw new Error(error.message);
  redirect(`/${locale}/account/messages/${c.id}`);
}

export async function sendMessage(conversationId: string, body: string, isInternal = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !body.trim()) return;
  await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: user.id, body: body.trim(), is_internal: isInternal });
  await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
}
