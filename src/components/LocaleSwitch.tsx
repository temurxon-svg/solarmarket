"use client";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitch({ current }: { current: string }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <select
      className="rounded border border-line bg-white px-2 py-1 text-sm"
      value={current}
      onChange={(e) => router.replace(pathname, { locale: e.target.value as "uz" })}
      aria-label="Language"
    >
      {routing.locales.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
    </select>
  );
}
