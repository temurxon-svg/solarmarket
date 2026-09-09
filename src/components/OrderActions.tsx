"use client";
import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { setOrderStatus } from "@/lib/actions/buyer";
import { useRouter } from "@/i18n/navigation";
export function OrderActions({ orderId, status, isBuyer, isSeller }: { orderId: string; status: string; isBuyer: boolean; isSeller: boolean }) {
  const t = useTranslations("account"); const router = useRouter();
  const [pending, start] = useTransition(); const [note, setNote] = useState("");
  const go = (s: string) => start(async () => { await setOrderStatus(orderId, s, note || undefined); router.refresh(); });
  const B = ({ s, label, primary }: { s: string; label: string; primary?: boolean }) => <button className={`btn text-sm ${primary ? "btn-primary" : ""}`} disabled={pending} onClick={() => go(s)}>{label}</button>;
  const actions: React.ReactNode[] = [];
  if (isSeller && ["sent", "negotiating"].includes(status)) actions.push(<B key="a" s="accepted" label={t("accept")} primary />, <B key="n" s="negotiating" label={t("counter")} />, <B key="d" s="declined" label={t("decline")} />);
  if (isSeller && status === "accepted") actions.push(<B key="c" s="contract_issued" label="Issue contract" primary />);
  if (isSeller && ["contract_issued", "signed"].includes(status)) actions.push(<B key="dl" s="delivered" label="Mark delivered" primary />);
  if (isBuyer && status === "negotiating") actions.push(<B key="ba" s="accepted" label={t("accept")} primary />);
  if (isBuyer && status === "delivered") actions.push(<B key="bc" s="completed" label={t("complete")} primary />);
  if (isBuyer && ["sent", "negotiating"].includes(status)) actions.push(<B key="bx" s="cancelled" label="Cancel" />);
  if (!actions.length) return null;
  return <div className="flex flex-wrap items-center gap-2"><input className="input max-w-xs text-sm" placeholder={t("note")} value={note} onChange={(e) => setNote(e.target.value)} />{actions}</div>;
}
