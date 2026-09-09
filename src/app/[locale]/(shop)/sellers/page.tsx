import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
export default async function Sellers() {
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("id, slug, name, region, status, rating_avg, rating_count, does_installation").neq("status", "suspended").order("name");
  return (
    <div>
      <h1 className="text-2xl font-semibold">Sellers</h1>
      <table className="table mt-6"><tbody>
        {data?.map((c) => (
          <tr key={c.id}><td><Link href={`/sellers/${c.slug}`} className="font-medium hover:underline">{c.name}</Link>{c.status === "verified" && <span className="chip chip-ok ml-2">✓</span>}</td><td className="text-ink-2">{c.region}</td><td className="tnum text-ink-2">{c.rating_count ? `${c.rating_avg} (${c.rating_count})` : "—"}</td></tr>
        ))}
      </tbody></table>
    </div>
  );
}
