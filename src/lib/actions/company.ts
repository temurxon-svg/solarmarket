"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);

function i18n(fd: FormData, key: string) {
  return { uz: String(fd.get(`${key}_uz`) ?? ""), ru: String(fd.get(`${key}_ru`) ?? ""), en: String(fd.get(`${key}_en`) ?? "") };
}

export async function createCompany(locale: string, fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const name = String(fd.get("name")).trim();
  const { data: c, error } = await supabase.from("companies").insert({
    name, slug: slugify(name), legal_name: fd.get("legal_name") || null, inn: fd.get("inn") || null,
    phone: fd.get("phone") || null, email: fd.get("email") || null, telegram: fd.get("telegram") || null,
    address: fd.get("address") || null, region: fd.get("region") || null,
    does_installation: fd.get("does_installation") === "on", description: i18n(fd, "description"), created_by: user.id,
  }).select("id").single();
  if (error) throw new Error(error.message);
  await supabase.from("company_members").insert({ company_id: c.id, user_id: user.id, role: "owner", display_name: user.user_metadata?.full_name ?? null });
  await supabase.from("subscriptions").insert({ company_id: c.id, plan_id: 1, status: "trial", current_period_end: new Date(Date.now() + 90 * 864e5).toISOString() });
  await supabase.from("profiles").update({ role: "seller" }).eq("id", user.id).eq("role", "buyer");
  revalidatePath("/", "layout");
  redirect(`/${locale}/dashboard/company/${c.id}`);
}

export async function updateCompany(id: string, fd: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("companies").update({
    name: String(fd.get("name")).trim(), legal_name: fd.get("legal_name") || null, inn: fd.get("inn") || null,
    phone: fd.get("phone") || null, email: fd.get("email") || null, telegram: fd.get("telegram") || null, website: fd.get("website") || null,
    address: fd.get("address") || null, region: fd.get("region") || null,
    regions_served: String(fd.get("regions_served") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    does_installation: fd.get("does_installation") === "on", description: i18n(fd, "description"),
  }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function saveListing(companyId: string, locale: string, fd: FormData) {
  const supabase = await createClient();
  const id = fd.get("id") ? String(fd.get("id")) : null;
  const row = {
    company_id: companyId, product_id: String(fd.get("product_id")),
    price: Number(fd.get("price")), currency: String(fd.get("currency")) as "UZS" | "USD",
    vat_included: fd.get("vat_included") === "on",
    min_order_qty: Number(fd.get("min_order_qty") || 1), unit: String(fd.get("unit") || "pcs"),
    stock_qty: fd.get("stock_qty") ? Number(fd.get("stock_qty")) : null,
    warranty_months: fd.get("warranty_months") ? Number(fd.get("warranty_months")) : null,
    availability: String(fd.get("availability") || "in_stock"), stock_location: fd.get("stock_location") || null,
    eta_date: fd.get("eta_date") || null, lead_time_days: fd.get("lead_time_days") ? Number(fd.get("lead_time_days")) : null,
    delivery_regions: String(fd.get("delivery_regions") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    price_visibility: String(fd.get("price_visibility") || "public"), wholesale_only: fd.get("wholesale_only") === "on",
    condition: String(fd.get("condition") || "new"), status: String(fd.get("status") || "active"),
    description: i18n(fd, "description"),
  };
  let listingId = id;
  if (id) {
    const { error } = await supabase.from("listings").update(row).eq("id", id); if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase.from("listings").insert(row).select("id").single(); if (error) throw new Error(error.message); listingId = data.id;
  }
  // price tiers: rows "tier_qty_N" / "tier_price_N"
  await supabase.from("listing_price_tiers").delete().eq("listing_id", listingId!);
  const tiers: { listing_id: string; min_qty: number; price: number; currency: string }[] = [];
  for (let i = 0; i < 5; i++) {
    const q = Number(fd.get(`tier_qty_${i}`)), p = Number(fd.get(`tier_price_${i}`));
    if (q > 0 && p > 0) tiers.push({ listing_id: listingId!, min_qty: q, price: p, currency: row.currency });
  }
  if (tiers.length) await supabase.from("listing_price_tiers").insert(tiers);
  revalidatePath("/", "layout");
  redirect(`/${locale}/dashboard/company/${companyId}`);
}

export async function deleteListing(companyId: string, listingId: string) {
  const supabase = await createClient();
  await supabase.from("listings").update({ status: "archived" }).eq("id", listingId).eq("company_id", companyId);
  revalidatePath("/", "layout");
}

export async function requestProduct(locale: string, fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const specs = JSON.parse(String(fd.get("specs_json") || "{}"));
  const category_id = Number(fd.get("category_id"));
  let brand_id = Number(fd.get("brand_id"));
  const newBrand = String(fd.get("new_brand") ?? "").trim();
  if (!brand_id && newBrand) {
    const { data: b } = await supabase.from("brands").insert({ slug: newBrand.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name: newBrand }).select("id").single();
    brand_id = b!.id;
  }
  const { data: cat } = await supabase.from("categories").select("slug").eq("id", category_id).single();
  const num = (k: string) => (specs[k] != null && specs[k] !== "" ? Number(specs[k]) : null);
  const { error } = await supabase.from("products").insert({
    category_id, brand_id, model: String(fd.get("model")).trim(), specs, requested_by: user.id, datasheet_url: fd.get("datasheet_url") || null,
    power_w: cat?.slug === "panel" ? num("power_w") : null, cell_type: specs.cell_type ?? null, efficiency_pct: num("efficiency_pct"),
    rated_kw: cat?.slug === "inverter" ? num("rated_kw") : null, inverter_type: specs.inverter_type ?? null, phases: num("phases"),
    capacity_kwh: cat?.slug === "battery" ? num("capacity_kwh") : null, chemistry: specs.chemistry ?? null,
    warranty_years: num("product_warranty_y") ?? num("warranty_y"),
    status: "pending",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect(`/${locale}/dashboard?requested=1`);
}
