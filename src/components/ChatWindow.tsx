"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/actions/buyer";

type M = { id: number; body: string | null; sender_id: string; created_at: string; is_internal?: boolean; name?: string };
export function ChatWindow({ conversationId, userId, isSeller, initial }: { conversationId: string; userId: string; isSeller: boolean; initial: M[] }) {
  const t = useTranslations("account");
  const [msgs, setMsgs] = useState<M[]>(initial); const [text, setText] = useState(""); const [internal, setInternal] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase.channel(`conv-${conversationId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => { const m = payload.new as M; setMsgs((cur) => cur.some((x) => x.id === m.id) ? cur : [...cur, m]); }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationId]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  const send = async () => { const b = text.trim(); if (!b) return; setText(""); await sendMessage(conversationId, b, internal);
    // optimistic
    setMsgs((cur) => [...cur, { id: Date.now(), body: b, sender_id: userId, created_at: new Date().toISOString(), is_internal: internal }]); };
  return (
    <>
      <div className="flex-1 space-y-2 overflow-y-auto py-3">
        {msgs.map((m) => { const mine = m.sender_id === userId; return (
          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded px-3 py-2 text-sm ${m.is_internal ? "border border-dashed border-warn bg-[#fdf6ea]" : mine ? "bg-ink text-white" : "bg-pale"}`}>
              {!mine && m.name && <div className="text-xs opacity-70">{m.name}</div>}
              {m.is_internal && <div className="text-xs text-warn">internal note</div>}
              <div className="whitespace-pre-wrap">{m.body}</div>
              <div className={`mt-1 text-[10px] ${mine && !m.is_internal ? "text-white/60" : "text-ink-2"}`}>{new Date(m.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</div>
            </div></div>); })}
        <div ref={end} />
      </div>
      <div className="flex items-center gap-2 border-t border-line pt-2">
        {isSeller && <label className="flex items-center gap-1 text-xs text-ink-2"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />int.</label>}
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("write")} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())} />
        <button className="btn btn-primary" onClick={send}>{t("sendMsg")}</button>
      </div>
    </>
  );
}
