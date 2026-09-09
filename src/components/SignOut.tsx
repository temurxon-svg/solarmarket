"use client";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
export function SignOut() {
  const t = useTranslations("nav"); const router = useRouter();
  return <button className="btn" onClick={async () => { await createClient().auth.signOut(); router.replace("/"); router.refresh(); }}>{t("logout")}</button>;
}
