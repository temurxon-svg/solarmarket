import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) { const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single(); isAdmin = p?.role === "admin"; }
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <Header locale={locale} signedIn={!!user} isAdmin={isAdmin} />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          <footer className="mt-16 border-t border-line py-6 text-sm text-ink-2">
            <div className="mx-auto max-w-6xl px-4">SolarMarket · Uzbekistan · 2026</div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
