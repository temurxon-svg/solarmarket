"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "@/i18n/navigation";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"password" | "code">("password");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [code, setCode] = useState("");
  const [sent, setSent] = useState(false); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const done = () => { router.replace(next || "/account"); router.refresh(); };

  const signIn = async () => {
    setErr(""); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false); if (error) setErr(error.message); else done();
  };
  const send = async () => { setErr(""); const { error } = await supabase.auth.signInWithOtp({ email }); if (error) setErr(error.message); else setSent(true); };
  const verify = async () => { setErr(""); const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" }); if (error) setErr(error.message); else done(); };

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <input className="input mt-5" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.uz" type="email" />
      {mode === "password" ? <>
        <input className="input mt-3" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t("password")} type="password" onKeyDown={(e) => e.key === "Enter" && signIn()} />
        <button className="btn btn-primary mt-3 w-full justify-center" onClick={signIn} disabled={busy}>{t("signIn")}</button>
        <button className="mt-3 text-sm text-ink-2 underline" onClick={() => setMode("code")}>{t("orCode")}</button>
      </> : !sent ? <>
        <button className="btn btn-primary mt-3 w-full justify-center" onClick={send}>{t("sendCode")}</button>
        <button className="mt-3 text-sm text-ink-2 underline" onClick={() => setMode("password")}>{t("orPass")}</button>
      </> : <>
        <input className="input mt-3 tnum" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
        <button className="btn btn-primary mt-3 w-full justify-center" onClick={verify}>{t("verify")}</button>
      </>}
      <p className="mt-4 text-xs text-ink-2">{t("demo")}</p>
      {err && <p className="mt-2 text-sm text-warn">{err}</p>}
    </div>
  );
}
