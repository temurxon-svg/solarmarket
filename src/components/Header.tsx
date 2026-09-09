import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitch } from "./LocaleSwitch";

export function Header({ locale, signedIn, isAdmin }: { locale: string; signedIn: boolean; isAdmin?: boolean }) {
  const t = useTranslations("nav");
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          <span className="text-amber">Solar</span>Market
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/catalog">{t("catalog")}</Link>
          <Link href="/compare">{t("compare")}</Link>
          <Link href="/sellers">{t("sellers")}</Link>
        </nav>
        <div className="ml-auto flex items-center gap-4 text-sm">
          {isAdmin && <Link href="/admin" className="text-amber-dark">Admin</Link>}
          <LocaleSwitch current={locale} />
          {signedIn ? <Link href="/account" className="btn">{t("dashboard")}</Link> : <Link href="/login" className="btn btn-primary">{t("login")}</Link>}
        </div>
      </div>
    </header>
  );
}
