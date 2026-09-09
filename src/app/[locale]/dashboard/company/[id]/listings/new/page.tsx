import { ListingForm } from "@/components/ListingForm";
import { saveListing } from "@/lib/actions/company";
export default async function NewListing({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <div><h1 className="mb-6 text-2xl font-semibold">New listing</h1><ListingForm action={saveListing.bind(null, id, locale)} /></div>;
}
