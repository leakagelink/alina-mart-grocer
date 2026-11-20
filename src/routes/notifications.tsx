import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, CheckCheck, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/lib/notifications";
import { useLang } from "@/lib/i18n";
import { type AdminNotification } from "@/lib/store";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [
    { title: "Notifications — Martigo" },
    { name: "description", content: "Your Martigo order updates, account activity and store messages." },
    { property: "og:title", content: "Notifications — Martigo" },
    { property: "og:description", content: "Read your Martigo activity updates and store messages." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: Notifications,
});

function Notifications() {
  const { rows, unread, readIds, markRead, me, error } = useNotifications();
  const { lang } = useLang();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [busy, setBusy] = useState(false);
  const local = (en: string, hi: string) => lang === "hi" ? hi : en;
  const shown = onlyUnread ? unread : rows;
  async function read(selected: AdminNotification[]) {
    setBusy(true);
    try { await markRead(selected); } catch { toast.error(local("Could not mark as read. Try again.", "पढ़ा हुआ सेव नहीं हुआ। फिर कोशिश करें।")); }
    finally { setBusy(false); }
  }
  return <div className="min-h-screen bg-background text-foreground"><Header />
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="flex items-center gap-2 text-xl font-extrabold"><Bell className="h-6 w-6 text-primary" />{local("Notifications", "नोटिफिकेशन")}</h1>{me && <Button variant="ghost" size="sm" disabled={busy || !unread.length} onClick={() => read(unread)}><CheckCheck />{local("Mark all read", "सब पढ़ा हुआ करें")}</Button>}</div>
      {!me ? <div className="py-16 text-center"><Bell className="mx-auto mb-4 h-10 w-10 text-muted-foreground" /><p className="mb-4 text-sm">{local("Sign in to see your notifications.", "अपनी नोटिफिकेशन देखने के लिए लॉगिन करें।")}</p><Button asChild><Link to="/signup">{local("Sign in", "लॉगिन")}</Link></Button></div> : <>
        <div className="my-4 flex gap-2"><Button size="sm" variant={!onlyUnread ? "default" : "outline"} onClick={() => setOnlyUnread(false)}>{local("All", "सभी")}</Button><Button size="sm" variant={onlyUnread ? "default" : "outline"} onClick={() => setOnlyUnread(true)}>{local("Unread", "बिना पढ़े")} ({unread.length})</Button></div>
        {error && <p role="alert" className="py-3 text-sm text-destructive">{local(error, "नोटिफिकेशन नहीं खुलीं। फिर कोशिश करें।")}</p>}
        {!shown.length && <p className="py-16 text-center text-sm text-muted-foreground">{local(onlyUnread ? "You're all caught up." : "No notifications yet.", onlyUnread ? "आपने सब पढ़ लिया है।" : "अभी कोई नोटिफिकेशन नहीं है।")}</p>}
        <div className="divide-y">{shown.map(n => { const isUnread = !readIds.includes(n.id); return <article key={n.id} className={`flex items-start gap-3 py-4 ${isUnread ? "bg-accent/30" : ""}`}>
          <Bell className={`mt-1 h-5 w-5 shrink-0 ${isUnread ? "text-primary" : "text-muted-foreground"}`} />
          <div className="min-w-0 flex-1"><h2 className="break-words text-sm font-bold">{lang === "hi" ? n.titleHi || n.title : n.title}</h2><p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{lang === "hi" ? n.bodyHi || n.body : n.body}</p><time className="mt-2 block text-xs text-muted-foreground">{new Date(n.at).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN")}</time>{n.orderId && <Button asChild variant="link" size="sm" className="mt-1 px-0"><Link to={me.role === "vendor" ? "/vendor" : "/orders/$id"} params={{ id: n.orderId }} onClick={() => { void read([n]); }}>{local("View order", "ऑर्डर देखें")}<ChevronRight /></Link></Button>}</div>
          {isUnread && <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" disabled={busy} aria-label={local("Mark as read", "पढ़ा हुआ करें")} title={local("Mark as read", "पढ़ा हुआ करें")} onClick={() => read([n])}><Check /></Button>}
        </article>; })}</div>
      </>}
    </main><BottomNav /></div>;
}