export function CompanyForm({ c, action, submitLabel }: { c?: Record<string, unknown>; action: (fd: FormData) => Promise<void>; submitLabel: string }) {
  const d = (c?.description ?? {}) as Record<string, string>;
  const v = (k: string) => (c?.[k] as string) ?? "";
  return (
    <form action={action} className="max-w-2xl space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2">Company name *<input name="name" required defaultValue={v("name")} className="input" /></label>
        <label>Legal name<input name="legal_name" defaultValue={v("legal_name")} className="input" /></label>
        <label>INN<input name="inn" defaultValue={v("inn")} className="input tnum" /></label>
        <label>Phone<input name="phone" defaultValue={v("phone")} className="input" /></label>
        <label>Email<input name="email" defaultValue={v("email")} className="input" /></label>
        <label>Telegram<input name="telegram" defaultValue={v("telegram")} className="input" placeholder="@username" /></label>
        <label>Website<input name="website" defaultValue={v("website")} className="input" /></label>
        <label>Region<input name="region" defaultValue={v("region")} className="input" placeholder="Toshkent" /></label>
        <label>Regions served (comma-separated)<input name="regions_served" defaultValue={((c?.regions_served as string[]) ?? []).join(", ")} className="input" /></label>
        <label className="col-span-2">Address<input name="address" defaultValue={v("address")} className="input" /></label>
      </div>
      <label className="flex items-center gap-2"><input type="checkbox" name="does_installation" defaultChecked={!!c?.does_installation} /> Also provides installation (profile attribute only)</label>
      <div className="grid grid-cols-3 gap-3">
        <label>Description (UZ)<textarea name="description_uz" defaultValue={d.uz} className="input" rows={3} /></label>
        <label>Описание (RU)<textarea name="description_ru" defaultValue={d.ru} className="input" rows={3} /></label>
        <label>Description (EN)<textarea name="description_en" defaultValue={d.en} className="input" rows={3} /></label>
      </div>
      <button className="btn btn-primary">{submitLabel}</button>
    </form>
  );
}
