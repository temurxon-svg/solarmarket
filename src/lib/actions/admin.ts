"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (p?.role !== "admin") throw new Error("Admin only");
  return { supabase, user };
}

export async function setProductStatus(id: string, status: "approved" | "rejected") {
  const { supabase, user } = await requireAdmin();
  await supabase.from("products").update({ status, approved_by: user.id }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function setCompanyStatus(id: string, status: "verified" | "pending" | "suspended") {
  const { supabase } = await requireAdmin();
  await supabase.from("companies").update({ status }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function setExchangeRate(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const rate = Number(formData.get("usd_uzs"));
  if (rate > 0) await supabase.from("exchange_rates").upsert({ rate_date: new Date().toISOString().slice(0, 10), usd_uzs: rate, source: "manual", set_by: user.id });
  revalidatePath("/", "layout");
}

export async function resolveAlert(id: number) {
  const { supabase, user } = await requireAdmin();
  await supabase.from("admin_alerts").update({ resolved_by: user.id, resolved_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/", "layout");
}
