"use client";
import { useState } from "react";
import { t as tx } from "@/lib/i18n-text";

type Cat = { id: number; slug: string; name: Record<string, string>; spec_schema: { key: string; label: Record<string, string>; type: string; unit?: string; options?: string[] }[] };
type Brand = { id: number; slug: string; name: string };
type Extracted = { category: string; brand: string; models: { model: string; specs: Record<string, unknown> }[] };

export function CatalogRequestForm({ locale, categories, brands, action }: { locale: string; categories: Cat[]; brands: Brand[]; action: (fd: FormData) => Promise<void> }) {
  const [catId, setCatId] = useState(categories[0]?.id ?? 0);
  const [brandId, setBrandId] = useState(0); const [newBrand, setNewBrand] = useState("");
  const [model, setModel] = useState(""); const [specs, setSpecs] = useState<Record<string, unknown>>({});
  const [extracted, setExtracted] = useState<Extracted | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const cat = categories.find((c) => c.id === catId);

  const extract = async (file: File) => {
    setBusy(true); setErr("");
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch("/api/extract-datasheet", { method: "POST", body: fd });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setErr(j.error ?? "Failed"); return; }
    setExtracted(j);
    const c = categories.find((x) => x.slug === j.category); if (c) setCatId(c.id);
    const b = brands.find((x) => x.name.toLowerCase().includes(String(j.brand).toLowerCase().split(" ")[0]));
    if (b) setBrandId(b.id); else setNewBrand(j.brand);
    pick(j.models?.[0]);
  };
  const pick = (m?: { model: string; specs: Record<string, unknown> }) => { if (!m) return; setModel(m.model); setSpecs(m.specs ?? {}); };

  return (
    <form action={action} className="max-w-2xl space-y-5 text-sm">
      <div className="rounded border border-dashed border-line p-4">
        <label className="block">Datasheet PDF (optional) — extraction uses Claude
          <input type="file" accept="application/pdf" className="mt-2 block" onChange={(e) => e.target.files?.[0] && extract(e.target.files[0])} disabled={busy} /></label>
        {busy && <p className="mt-2 text-ink-2">Reading datasheet…</p>}
        {err && <p className="mt-2 text-warn">{err}</p>}
        {extracted && extracted.models?.length > 1 && <div className="mt-3">
          <p className="text-ink-2">Found {extracted.models.length} models — pick one (submit each separately):</p>
          <div className="mt-1 flex flex-wrap gap-2">{extracted.models.map((m) => <button type="button" key={m.model} className={`btn text-xs ${m.model === model ? "bg-ink text-white" : ""}`} onClick={() => pick(m)}>{m.model}</button>)}</div>
        </div>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label>Category<select name="category_id" value={catId} onChange={(e) => { setCatId(Number(e.target.value)); }} className="input">
          {categories.map((c) => <option key={c.id} value={c.id}>{tx(c.name, locale, c.slug)}</option>)}</select></label>
        <label>Brand<select name="brand_id" value={brandId} onChange={(e) => setBrandId(Number(e.target.value))} className="input">
          <option value={0}>— new brand —</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        {!brandId && <label>New brand name<input name="new_brand" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} className="input" /></label>}
        <label className="col-span-2">Model code *<input name="model" required value={model} onChange={(e) => setModel(e.target.value)} className="input" /></label>
        <label className="col-span-2">Datasheet URL<input name="datasheet_url" className="input" placeholder="https://…" /></label>
      </div>

      <fieldset className="rounded border border-line p-3">
        <legend className="px-1 text-ink-2">Specifications</legend>
        <div className="grid grid-cols-2 gap-3">
          {cat?.spec_schema.map((s) => (
            <label key={s.key}>{tx(s.label, locale, s.key)} {s.unit && <span className="text-ink-2">({s.unit})</span>}
              {s.type === "enum" ? <select className="input" value={String(specs[s.key] ?? "")} onChange={(e) => setSpecs({ ...specs, [s.key]: e.target.value })}><option value="">—</option>{s.options?.map((o) => <option key={o}>{o}</option>)}</select>
              : s.type === "boolean" ? <select className="input" value={specs[s.key] == null ? "" : String(specs[s.key])} onChange={(e) => setSpecs({ ...specs, [s.key]: e.target.value === "" ? undefined : e.target.value === "true" })}><option value="">—</option><option value="true">yes</option><option value="false">no</option></select>
              : <input className="input tnum" value={String(specs[s.key] ?? "")} onChange={(e) => setSpecs({ ...specs, [s.key]: s.type === "number" ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value })} />}
            </label>
          ))}
          {!cat?.spec_schema.length && <p className="col-span-2 text-ink-2">No structured specs for this category.</p>}
        </div>
      </fieldset>
      <input type="hidden" name="specs_json" value={JSON.stringify(specs)} />
      <button className="btn btn-primary">Submit for approval</button>
    </form>
  );
}
