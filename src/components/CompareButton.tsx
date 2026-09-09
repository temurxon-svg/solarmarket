"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const KEY = "sm_compare";
export function readCompare(): string[] { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } }
export function writeCompare(ids: string[]) { localStorage.setItem(KEY, JSON.stringify(ids.slice(0, 4))); window.dispatchEvent(new Event("sm_compare")); }

export function CompareButton({ id }: { id: string }) {
  const t = useTranslations("product");
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(readCompare().includes(id));
    sync(); window.addEventListener("sm_compare", sync); return () => window.removeEventListener("sm_compare", sync);
  }, [id]);
  return (
    <button type="button" className={`btn text-xs ${on ? "bg-ink text-white" : ""}`}
      onClick={() => { const ids = readCompare(); writeCompare(on ? ids.filter((x) => x !== id) : [...ids, id]); }}>
      {on ? "✓" : "+"} {t("addCompare")}
    </button>
  );
}
