import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { CompanyForm } from "@/components/CompanyForm";
import { updateCompany, deleteListing } from "@/lib/actions/company";
import { fmtUzs } from "@/lib/i18n-text";

export default async function CompanyPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const { data: c } = await supabase.from("companies").select("*").eq("id", id).single();
  if (!c) return <p>Not found.</p>;
  const [{ data: listings }, { data: members }, { data: sub }] = await Promise.all([
    supabase.from("listings").select("id, price, currency, price_uzs, min_order_qty, unit, availability, status, price_visibility, price_updated_at, products(model, brands(name))").eq("company_id", id).neq("status", "archived").order("updated_at", { ascending: false }),
    supabase.from("company_members").select("user_id, role, display_name, is_active, profiles(full_name, phone)").eq("company_id", id),
    supabase.from("subscriptions").select("status, current_period_end, plans(code, name, max_listings, max_members)").eq("company_id", id).order("current_period_end", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const plan = sub?.plans as unknown as { code: string; max_listings: number | null; max_members: number } | null;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">{c.name}</h1>
          <p className="text-sm text-ink-2"><span className={`chip ${c.status === "verified" ? "chip-ok" : ""}`}>{c.status}</span> · plan <b>{plan?.code ?? "free"}</b> ({sub?.status}) · {plan?.max_members ?? 1} seats · <Link href={`/sellers/${c.slug}`} className="underline">public page</Link></p></div>
        <Link href={`/dashboard/company/${id}/listings/new`} className="btn btn-primary">+ New listing</Link>
      </div>

      <section>
        <h2 className="mb-2 font-medium">Listings ({listings?.length ?? 0}{plan?.max_listings ? ` / ${plan.max_listings}` : ""})</h2>
        <table className="table"><thead><tr><th>Product</th><th className="tnum">Price</th><th className="tnum">Min qty</th><th>Availability</th><th>Visibility</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>
          {listings?.map((l) => { const p = l.products as unknown as { model: string; brands: { name: string } }; return (
            <tr key={l.id}>
              <td>{p?.brands?.name} {p?.model}</td>
              <td className="tnum">{fmtUzs(l.price_uzs, locale)}{l.currency === "USD" && <div className="text-xs text-ink-2">${l.price}</div>}</td>
              <td className="tnum">{l.min_order_qty} {l.unit}</td><td><span className="chip">{l.availability}</span></td><td className="text-xs">{l.price_visibility}</td><td><span className={`chip ${l.status === "active" ? "chip-ok" : ""}`}>{l.status}</span></td>
              <td className="text-xs text-ink-2">{new Date(l.price_updated_at).toLocaleDateString("ru-RU")}</td>
              <td className="whitespace-nowrap"><Link href={`/dashboard/company/${id}/listings/${l.id}`} className="btn text-xs">Edit</Link>{" "}
                <form action={deleteListing.bind(null, id, l.id)} className="inline"><button className="btn text-xs">Archive</button></form></td>
            </tr>); })}
          {!listings?.length && <tr><td colSpan={8} className="text-ink-2">No listings yet.</td></tr>}
        </tbody></table>
        <p className="mt-2 text-sm text-ink-2">Product missing from the catalog? <Link href="/dashboard/catalog-request" className="underline">Request a new product</Link> (from a datasheet PDF or manually).</p>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Team ({members?.length ?? 0} / {plan?.max_members ?? 1})</h2>
        <table className="table max-w-xl"><tbody>
          {members?.map((m) => { const pr = m.profiles as unknown as { full_name: string; phone: string }; return <tr key={m.user_id}><td>{m.display_name ?? pr?.full_name}</td><td className="text-ink-2">{m.role}</td><td className="text-ink-2">{pr?.phone}</td></tr>; })}
        </tbody></table>
        <p className="mt-2 text-sm text-ink-2">Invitations and assignment rules: Week 3.</p>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Company profile</h2>
        <CompanyForm c={c} action={updateCompany.bind(null, id)} submitLabel="Save" />
      </section>
    </div>
  );
}
