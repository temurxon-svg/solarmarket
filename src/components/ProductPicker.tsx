"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type P = { id: string; model: string; brands: { name: string } | null; categories: { slug: string } | null };
export function ProductPicker({ initial }: { initial: { id: string; label: string } | null }) {
  const [q, setQ] = useState(""); const [res, setRes] = useState<P[]>([]); const [sel, setSel] = useState(initial);
  useEffect(() => {
    if (q.length < 2) { setRes([]); return; }
    const h = setTimeout(async () => {
      const { data } = await createClient().from("products").select("id, model, brands(name), categories(slug)").eq("status", "approved").ilike("model", `%${q}%`).limit(10);
      setRes((data as unknown as P[]) ?? []);
    }, 250);
    return () => clearTimeout(h);
  }, [q]);
  return (
    <div>
      <input type="hidden" name="product_id" value={sel?.id ?? ""} required />
      {sel ? <div className="flex items-center gap-2"><span className="chip">{sel.label}</span><button type="button" className="btn text-xs" onClick={() => setSel(null)}>change</button></div>
      : <div className="relative">
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type model, e.g. SUN-12K or Tiger Neo" />
          {res.length > 0 && <ul className="absolute z-10 mt-1 w-full rounded border border-line bg-white shadow">
            {res.map((p) => <li key={p.id}><button type="button" className="block w-full px-3 py-2 text-left hover:bg-pale" onClick={() => { setSel({ id: p.id, label: `${p.brands?.name} ${p.model}` }); setRes([]); }}>
              <span className="text-ink-2">{p.categories?.slug}</span> · {p.brands?.name} <b>{p.model}</b></button></li>)}
          </ul>}
        </div>}
    </div>
  );
}
