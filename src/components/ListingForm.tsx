import { ProductPicker } from "./ProductPicker";

type Tier = { min_qty: number; price: number };
export function ListingForm({ l, tiers = [], action, product }: {
  l?: Record<string, unknown>; tiers?: Tier[]; action: (fd: FormData) => Promise<void>;
  product?: { id: string; label: string } | null;
}) {
  const v = (k: string, d = ""): string => { const x = l?.[k]; return x == null ? d : String(x); };
  const d = (l?.description ?? {}) as Record<string, string>;
  const t: { min_qty: number | string; price: number | string }[] = [...tiers, ...Array(Math.max(0, 3 - tiers.length)).fill({ min_qty: "", price: "" })];
  return (
    <form action={action} className="max-w-2xl space-y-5 text-sm">
      {l?.id ? <input type="hidden" name="id" value={String(l.id)} /> : null}
      <div><label className="block">Product *</label><ProductPicker initial={product ?? null} /></div>

      <div className="grid grid-cols-3 gap-3">
        <label>Price *<input name="price" type="number" step="0.01" required defaultValue={v("price")} className="input tnum" /></label>
        <label>Currency<select name="currency" defaultValue={v("currency", "UZS")} className="input"><option>UZS</option><option>USD</option></select></label>
        <label className="flex items-end gap-2 pb-2"><input type="checkbox" name="vat_included" defaultChecked={l ? !!l.vat_included : true} /> VAT included</label>
        <label>Min order qty<input name="min_order_qty" type="number" defaultValue={v("min_order_qty", "1")} className="input tnum" /></label>
        <label>Unit<select name="unit" defaultValue={v("unit", "pcs")} className="input"><option value="pcs">pcs</option><option value="pallet">pallet</option><option value="container">container</option><option value="m">m</option></select></label>
        <label>Stock qty<input name="stock_qty" type="number" defaultValue={v("stock_qty")} className="input tnum" /></label>
      </div>

      <fieldset className="rounded border border-line p-3">
        <legend className="px-1 text-ink-2">Quantity price breaks (optional)</legend>
        <div className="grid grid-cols-3 gap-3">
          {t.slice(0, 5).map((tier, i) => (
            <div key={i} className="flex gap-2">
              <input name={`tier_qty_${i}`} type="number" placeholder="from qty" defaultValue={tier.min_qty} className="input tnum" />
              <input name={`tier_price_${i}`} type="number" step="0.01" placeholder="price" defaultValue={tier.price} className="input tnum" />
            </div>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-3 gap-3">
        <label>Availability<select name="availability" defaultValue={v("availability", "in_stock")} className="input">
          <option value="in_stock">In stock</option><option value="in_transit">In transit</option><option value="pre_order">Pre-order</option><option value="on_request">On request</option></select></label>
        <label>Stock location<input name="stock_location" defaultValue={v("stock_location")} className="input" placeholder="Toshkent, Sergeli" /></label>
        <label>ETA date<input name="eta_date" type="date" defaultValue={v("eta_date")} className="input" /></label>
        <label>Lead time (days)<input name="lead_time_days" type="number" defaultValue={v("lead_time_days")} className="input tnum" /></label>
        <label>Warranty (months)<input name="warranty_months" type="number" defaultValue={v("warranty_months")} className="input tnum" /></label>
        <label>Delivery regions<input name="delivery_regions" defaultValue={((l?.delivery_regions as string[]) ?? []).join(", ")} className="input" placeholder="Toshkent, Samarqand" /></label>
        <label>Price visibility<select name="price_visibility" defaultValue={v("price_visibility", "public")} className="input">
          <option value="public">Public</option><option value="dealers_only">Dealers only</option><option value="on_request">On request</option></select></label>
        <label>Condition<select name="condition" defaultValue={v("condition", "new")} className="input"><option value="new">New</option><option value="used">Used</option><option value="refurbished">Refurbished</option></select></label>
        <label>Status<select name="status" defaultValue={v("status", "active")} className="input"><option value="active">Active</option><option value="draft">Draft</option><option value="hidden">Hidden</option><option value="sold_out">Sold out</option></select></label>
      </div>
      <label className="flex items-center gap-2"><input type="checkbox" name="wholesale_only" defaultChecked={!!l?.wholesale_only} /> Wholesale only</label>

      <div className="grid grid-cols-3 gap-3">
        <label>Note (UZ)<textarea name="description_uz" defaultValue={d.uz} className="input" rows={2} /></label>
        <label>Примечание (RU)<textarea name="description_ru" defaultValue={d.ru} className="input" rows={2} /></label>
        <label>Note (EN)<textarea name="description_en" defaultValue={d.en} className="input" rows={2} /></label>
      </div>
      <button className="btn btn-primary">Save listing</button>
    </form>
  );
}
