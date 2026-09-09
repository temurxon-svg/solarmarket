import { CompareView } from "@/components/CompareView";
export default async function ComparePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <CompareView locale={locale} />;
}
