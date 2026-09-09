export type I18nText = Partial<Record<"uz" | "ru" | "en", string>> | null | undefined;
export function t(text: I18nText, locale: string, fallback = ""): string {
  if (!text) return fallback;
  return text[locale as "uz"] ?? text.uz ?? text.ru ?? text.en ?? fallback;
}
export function fmtUzs(n: number | null | undefined, locale = "uz") {
  if (n == null) return "—";
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU", { maximumFractionDigits: 0 }).format(n) + " UZS";
}
