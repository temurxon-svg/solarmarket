import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROMPT = `You are extracting technical data from a solar equipment datasheet.
Return ONLY a JSON object, no prose, no markdown fences, with this shape:
{
 "category": "panel" | "inverter" | "battery" | "mounting" | "cable" | "accessory",
 "brand": string,
 "models": [ { "model": string, "specs": { ... } } ]
}
Datasheets often list several models in one table (e.g. 570W/575W/580W/585W) - return each as a separate entry.
Spec keys by category (use exactly these keys, numbers as numbers, omit unknown):
 panel:    power_w, cell_type ("perc"|"topcon"|"hjt"), efficiency_pct, bifacial (bool), product_warranty_y, performance_warranty_y, dimensions_mm ("LxWxH"), weight_kg, voc, isc, vmp, imp, cells
 inverter: inverter_type ("on_grid"|"hybrid"|"off_grid"), rated_kw, phases (1|3), max_pv_kw, mppt_count, battery_voltage ("48"|"HV"), max_charge_a, ip_rating, warranty_y, max_efficiency_pct
 battery:  chemistry ("lifepo4"|"nmc"|"lead_acid"|"gel"), capacity_kwh, voltage, dod_pct, cycles, max_discharge_kw, max_charge_kw, warranty_y, weight_kg, dimensions_mm
 others:   free keys, keep short.
Model = manufacturer model code (e.g. "JKM580N-72HL4-BDV"), not the marketing name; put the marketing series in "series" spec.`;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set in .env.local" }, { status: 400 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6", max_tokens: 4000,
      messages: [{ role: "user", content: [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } },
        { type: "text", text: PROMPT },
      ] }],
    }),
  });
  if (!r.ok) return NextResponse.json({ error: `Claude API ${r.status}: ${await r.text()}` }, { status: 500 });
  const data = await r.json();
  const text = (data.content ?? []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("\n");
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Could not parse extraction", raw: text }, { status: 500 });
  }
}
