import { CompanyForm } from "@/components/CompanyForm";
import { createCompany } from "@/lib/actions/company";
export default async function NewCompany({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <div><h1 className="mb-6 text-2xl font-semibold">New company</h1><CompanyForm action={createCompany.bind(null, locale)} submitLabel="Create company" /></div>;
}
