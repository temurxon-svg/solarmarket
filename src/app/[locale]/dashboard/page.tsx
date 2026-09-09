import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { SignOut } from "@/components/SignOut";

export default async function Dashboard() {
  const t = await getTranslations("dashboard");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: memberships } = await supabase.from("company_members").select("role, companies(id, name, slug, status)").eq("user_id", user!.id);
  return (
    <div>
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">{t("title")}</h1><SignOut /></div>
      <p className="mt-1 text-sm text-ink-2">{user?.email ?? user?.phone}</p>
      <h2 className="mt-8 mb-2 font-medium">{t("companies")}</h2>
      {memberships?.length ? (
        <table className="table max-w-xl"><tbody>
          {memberships.map((m, i) => { const c = m.companies as unknown as { id: string; name: string; slug: string; status: string }; return (
            <tr key={i}><td><Link href={`/dashboard/company/${c.id}`} className="font-medium hover:underline">{c.name}</Link></td><td className="text-ink-2">{m.role}</td><td><span className={`chip ${c.status === "verified" ? "chip-ok" : ""}`}>{c.status}</span></td></tr>
          ); })}
        </tbody></table>
      ) : <p className="text-ink-2">{t("noCompany")}</p>}
      <div className="mt-4 flex gap-2"><Link href="/dashboard/company/new" className="btn btn-primary">{t("createCompany")}</Link><Link href="/dashboard/catalog-request" className="btn">Request catalog product</Link></div>
    </div>
  );
}
