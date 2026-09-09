"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleFavorite } from "@/lib/actions/buyer";
import { useRouter } from "@/i18n/navigation";
export function FavoriteButton({ listingId, active }: { listingId: string; active: boolean }) {
  const t = useTranslations("account"); const router = useRouter();
  const [on, setOn] = useState(active); const [pending, start] = useTransition();
  return <button className={`btn text-xs ${on ? "bg-ink text-white" : ""}`} disabled={pending} title={on ? t("unfav") : t("fav")}
    onClick={() => start(async () => { const r = await toggleFavorite(listingId); if (r?.error === "login") router.push("/login"); else setOn(!on); })}>{on ? "★" : "☆"}</button>;
}
