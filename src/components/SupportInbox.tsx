import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Headphones, RefreshCw, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { currentAccount, hydrateAccounts, useAccounts } from "@/lib/accounts";
import { useLang } from "@/lib/i18n";
import { supportSchema } from "@/lib/support-schema";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type Request = Database["public"]["Tables"]["support_requests"]["Row"];

export function SupportInbox({ admin = false }: { admin?: boolean }) {
  const me = currentAccount(useAccounts());
  const { lang } = useLang();
  const text = (en: string, hi: string) => lang === "hi" ? hi : en;
  const [requests, setRequests] = useState<Request[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  useEffect(() => { void hydrateAccounts(); }, []);
  useEffect(() => {
    let active = true;
    setRequests([]);
    if (!me) { setLoading(false); return; }
    const load = async () => {
      let query = supabase.from("support_requests").select("*").order("created_at", { ascending: false });
      if (!admin) query = query.eq("user_id", me.id);
      const result = await query;
      if (active) { setError(Boolean(result.error)); setLoading(false); setRequests(result.data ?? []); }
    };
    setLoading(true);
    void load();
    const channel = supabase.channel(`support-${me.id}-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_requests", ...(admin ? {} : { filter: `user_id=eq.${me.id}` }) }, () => { void load(); }).subscribe();
    const focus = () => { void load(); };
    window.addEventListener("focus", focus);
    return () => { active = false; window.removeEventListener("focus", focus); void supabase.removeChannel(channel); };
  }, [me?.id, admin, refresh]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!me || busy) return;
    const parsed = supportSchema.safeParse({ subject, message });
    if (!parsed.success) { toast.error(text("Enter a subject and at least 10 characters describing your issue.", "विषय और कम से कम 10 अक्षरों में अपनी समस्या लिखें।")); return; }
    setBusy(true);
    const result = await supabase.from("support_requests").insert({ user_id: me.id, ...parsed.data }).select().single();
    setBusy(false);
    if (result.error) { toast.error(text("Request could not send. Please retry.", "अनुरोध नहीं भेजा गया। फिर कोशिश करें।")); return; }
    setSubject(""); setMessage(""); setRefresh(v => v + 1);
    toast.success(text("Support request sent", "सपोर्ट अनुरोध भेज दिया गया"));
  }

  async function reply(row: Request, resolve: boolean) {
    if (busy) return;
    const value = (drafts[row.id] ?? row.reply).trim();
    if ((!resolve && !value) || value.length > 2000) { toast.error(text("Write a reply first.", "पहले जवाब लिखें।")); return; }
    setBusy(true);
    const result = await supabase.from("support_requests").update({ reply: value, status: resolve ? "resolved" : "open" }).eq("id", row.id).select().single();
    setBusy(false);
    if (result.error) { toast.error(text("Update failed. Please retry.", "अपडेट नहीं हुआ। फिर कोशिश करें।")); return; }
    setRefresh(v => v + 1);
    toast.success(text("Support request updated", "सपोर्ट अनुरोध अपडेट हो गया"));
  }

  if (!me) return <div className="py-12 text-center"><Headphones className="mx-auto mb-4 h-10 w-10 text-primary" /><p className="mb-4 text-sm">{text("Sign in to contact customer support.", "कस्टमर सपोर्ट से संपर्क करने के लिए लॉगिन करें।")}</p><Button asChild><Link to="/signup">{text("Sign in", "लॉगिन")}</Link></Button></div>;
  return <div className="space-y-6">
    {!admin && <form onSubmit={submit} className="space-y-3 border-b pb-6">
      <label className="block text-sm font-semibold" htmlFor="support-subject">{text("Subject", "विषय")}</label>
      <input id="support-subject" required minLength={3} maxLength={80} value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-lg border bg-card px-3 py-3 text-sm" />
      <label className="block text-sm font-semibold" htmlFor="support-message">{text("Your problem", "आपकी समस्या")}</label>
      <textarea id="support-message" required minLength={10} maxLength={2000} rows={4} value={message} onChange={e => setMessage(e.target.value)} className="w-full rounded-lg border bg-card px-3 py-3 text-sm" />
      <Button type="submit" disabled={busy}><Send />{text(busy ? "Sending…" : "Send request", busy ? "भेज रहे हैं…" : "अनुरोध भेजें")}</Button>
    </form>}
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-bold">{text(admin ? "Customer requests" : "My requests", admin ? "कस्टमर अनुरोध" : "मेरे अनुरोध")}</h2><Button size="icon" variant="ghost" onClick={() => setRefresh(v => v + 1)} aria-label={text("Refresh requests", "अनुरोध रिफ्रेश करें")} title={text("Refresh requests", "अनुरोध रिफ्रेश करें")}><RefreshCw className={loading ? "animate-spin" : ""} /></Button></div>
    <div className="flex gap-2">{["all", "open", "resolved"].map(value => <Button key={value} size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)}>{value === "all" ? text("All", "सभी") : value === "open" ? text("Open", "खुले") : text("Resolved", "हल हुए")}</Button>)}</div>
    {error ? <p role="alert" className="text-sm text-destructive">{text("Requests could not load. Tap refresh to retry.", "अनुरोध नहीं खुले। रिफ्रेश करके फिर कोशिश करें।")}</p> : loading ? <p role="status" className="text-sm text-muted-foreground">{text("Loading…", "लोड हो रहा है…")}</p> : !requests.some(r => filter === "all" || r.status === filter) && <p className="py-8 text-center text-sm text-muted-foreground">{text("No requests here yet", "अभी कोई अनुरोध नहीं है")}</p>}
    <div className="space-y-3">{requests.filter(r => filter === "all" || r.status === filter).map(row => <article key={row.id} className="min-w-0 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="min-w-0 break-words font-bold">{row.subject}</h3><span className={`text-xs font-semibold ${row.status === "resolved" ? "text-primary" : "text-muted-foreground"}`}>{row.status === "resolved" ? text("Resolved", "हल हुआ") : text("Open", "खुला")}</span></div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm">{row.message}</p>
      <p className="mt-2 text-xs text-muted-foreground">#{row.id.slice(0, 8)} · {new Date(row.created_at).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN")}</p>
      {row.reply && <div className="mt-3 border-l-2 border-primary pl-3"><p className="text-xs font-bold text-primary">{text("Martigo support", "Martigo सपोर्ट")}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{row.reply}</p></div>}
      {admin && <div className="mt-4 space-y-2"><label htmlFor={`reply-${row.id}`} className="text-xs font-semibold">{text("Reply", "जवाब")}</label><textarea id={`reply-${row.id}`} rows={3} maxLength={2000} value={drafts[row.id] ?? row.reply} onChange={e => setDrafts(v => ({ ...v, [row.id]: e.target.value }))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" /><div className="flex flex-wrap gap-2"><Button size="sm" disabled={busy} onClick={() => reply(row, false)}><Send />{text("Send reply", "जवाब भेजें")}</Button><Button size="sm" variant="outline" disabled={busy || row.status === "resolved"} onClick={() => reply(row, true)}><CheckCircle2 />{text("Resolve", "हल हुआ")}</Button></div></div>}
    </article>)}</div>
  </div>;
}