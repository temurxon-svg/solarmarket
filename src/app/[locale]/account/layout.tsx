import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOut } from "@/components/SignOut";
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("account");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: memberships } = user ? await supabase.from("company_members").select("company_id").eq("user_id", user.id) : { data: [] };
  return (
    <div className="grid gap-8 md:grid-cols-[180px_1fr]">
      <aside className="text-sm">
        <p className="mb-3 font-medium">{t("title")}</p>
        <nav className="flex flex-col gap-2">
          <Link href="/account/orders">{t("orders")}</Link>
          <Link href="/account/messages">{t("messages")}</Link>
          <Link href="/account/favorites">{t("favorites")}</Link>
          {!!memberships?.length && <Link href="/dashboard" className="mt-2 text-amber-dark">Seller dashboard →</Link>}
        </nav>
        <div className="mt-6"><SignOut /></div>
      </aside>
      <div>{children}</div>
    </div>
  );
}
