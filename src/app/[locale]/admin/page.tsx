import { createClient } from "@/lib/supabase/server";
import { setProductStatus, setCompanyStatus, setExchangeRate, resolveAlert } from "@/lib/actions/admin";
import { t as tx } from "@/lib/i18n-text";

export default async function Admin({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (me?.role !== "admin") return <p className="text-warn">Admin only.</p>;

  const [{ data: products }, { data: companies }, { data: rate }, { data: alerts }, { count: users }, { count: listings }] = await Promise.all([
    supabase.from("products").select("id, model, specs, datasheet_url, brands(name), categories(name)").eq("status", "pending").order("created_at"),
    supabase.from("companies").select("id, name, inn, phone, region, status, created_at").eq("status", "pending").order("created_at"),
    supabase.from("exchange_rates").select("*").order("rate_date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("admin_alerts").select("*").is("resolved_at", null).order("created_at", { ascending: false }).limit(20),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex items-baseline justify-between"><h1 className="text-2xl font-semibold">Admin</h1><p className="text-sm text-ink-2 tnum">{users} users · {listings} active listings</p></div>

      <section>
        <h2 className="mb-2 font-medium">Exchange rate</h2>
        <form action={setExchangeRate} className="flex items-end gap-2 text-sm">
          <label>USD → UZS<br /><input name="usd_uzs" defaultValue={rate?.usd_uzs} className="input w-32 tnum" /></label>
          <button className="btn">Save</button>
          <span className="text-ink-2">{rate ? `set ${rate.rate_date} (${rate.source})` : "not set"}</span>
        </form>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Products pending approval ({products?.length ?? 0})</h2>
        <table className="table"><tbody>
          {products?.map((p) => (
            <tr key={p.id}>
              <td className="text-ink-2">{tx((p.categories as unknown as { name: never })?.name, locale)}</td>
              <td className="font-medium">{(p.brands as unknown as { name: string })?.name} {p.model}</td>
              <td className="text-xs text-ink-2">{Object.entries(p.specs ?? {}).slice(0, 6).map(([k, v]) => `${k}: ${v}`).join(" · ")}</td>
              <td>{p.datasheet_url && <a href={p.datasheet_url} target="_blank" className="text-xs underline">PDF</a>}</td>
              <td className="whitespace-nowrap">
                <form action={setProductStatus.bind(null, p.id, "approved")} className="inline"><button className="btn btn-primary text-xs">Approve</button></form>{" "}
                <form action={setProductStatus.bind(null, p.id, "rejected")} className="inline"><button className="btn text-xs">Reject</button></form>
              </td>
            </tr>
          ))}
          {!products?.length && <tr><td className="text-ink-2">—</td></tr>}
        </tbody></table>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Companies pending verification ({companies?.length ?? 0})</h2>
        <table className="table"><tbody>
          {companies?.map((c) => (
            <tr key={c.id}>
              <td className="font-medium">{c.name}</td><td className="text-ink-2">{c.region}</td><td className="tnum">{c.inn ?? "—"}</td><td>{c.phone}</td>
              <td className="whitespace-nowrap">
                <form action={setCompanyStatus.bind(null, c.id, "verified")} className="inline"><button className="btn btn-primary text-xs">Verify</button></form>{" "}
                <form action={setCompanyStatus.bind(null, c.id, "suspended")} className="inline"><button className="btn text-xs">Suspend</button></form>
              </td>
            </tr>
          ))}
          {!companies?.length && <tr><td className="text-ink-2">—</td></tr>}
        </tbody></table>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Alerts ({alerts?.length ?? 0})</h2>
        <table className="table"><tbody>
          {alerts?.map((a) => (
            <tr key={a.id}><td><span className={`chip ${a.severity === "high" ? "chip-warn" : ""}`}>{a.kind}</span></td><td className="text-xs text-ink-2">{JSON.stringify(a.details)}</td>
              <td><form action={resolveAlert.bind(null, a.id)}><button className="btn text-xs">Resolve</button></form></td></tr>
          ))}
          {!alerts?.length && <tr><td className="text-ink-2">—</td></tr>}
        </tbody></table>
      </section>
    </div>
  );
}
