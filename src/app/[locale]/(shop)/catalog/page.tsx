import { redirect } from "@/i18n/navigation";
export default async function Catalog({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }) {
  const { locale } = await params;
  const { q } = await searchParams;
  redirect({ href: { pathname: "/catalog/panel", query: q ? { q } : undefined }, locale });
}
