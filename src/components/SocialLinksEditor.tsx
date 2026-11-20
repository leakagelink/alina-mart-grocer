import { useState } from "react";
import { Facebook, Instagram, Link2, Pencil, Plus, Trash2, ExternalLink, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateSocialLinks, type Account } from "@/lib/accounts";
import { socialLinkSchema, type SocialLink } from "@/lib/social-links";
import { useLang } from "@/lib/i18n";

const platforms = { facebook: "Facebook", instagram: "Instagram", x: "X", other: "Other" };
const icons = { facebook: Facebook, instagram: Instagram, x: X, other: Link2 };
export function SocialLinksEditor({ me }: { me: Account }) {
  const { lang } = useLang();
  const text = (en: string, hi: string) => lang === "hi" ? hi : en;
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<SocialLink | null>(null);
  const [busy, setBusy] = useState(false);
  const links = me.socialLinks ?? [];
  const field = "mt-1 w-full rounded-lg border bg-background px-3 py-2.5 text-sm";
  async function persist(next: SocialLink[]) {
    setBusy(true);
    try { await updateSocialLinks(me.id, next); toast.success(text("Social accounts saved", "सोशल अकाउंट सेव हो गए")); setDraft(null); setEditing(null); }
    catch { toast.error(text("Could not save. Please retry.", "सेव नहीं हुआ। फिर कोशिश करें।")); }
    finally { setBusy(false); }
  }
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || busy) return;
    const result = socialLinkSchema.safeParse(draft);
    if (!result.success) { toast.error(text("Enter a valid profile link for the selected platform.", "चुने हुए प्लेटफॉर्म का सही प्रोफाइल लिंक डालें।")); return; }
    void persist(editing === null ? [...links, result.data] : links.map((link, index) => index === editing ? result.data : link));
  }
  return <section className="mt-6 border-t pt-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-sm font-extrabold"><Link2 className="h-4 w-4 text-primary" />{text("Social accounts", "सोशल अकाउंट")}</h2>{!draft && <Button size="sm" variant="outline" disabled={busy || links.length >= 10} onClick={() => { setEditing(null); setDraft({ platform: "facebook", label: "Facebook", url: "" }); }}><Plus />{text("Add", "जोड़ें")}</Button>}</div>
    {draft && <form onSubmit={save} className="mt-3 space-y-3">
      <div><label htmlFor="social-platform" className="text-xs font-bold">{text("Platform", "प्लेटफॉर्म")}</label><select id="social-platform" className={field} value={draft.platform} disabled={busy} onChange={e => { const platform = e.target.value as SocialLink["platform"]; setDraft({ ...draft, platform, label: platform === "other" ? "" : platforms[platform] }); }}>{Object.entries(platforms).map(([value, label]) => <option key={value} value={value}>{value === "other" ? text("Other", "अन्य") : label}</option>)}</select></div>
      {draft.platform === "other" && <div><label htmlFor="social-name" className="text-xs font-bold">{text("Account name", "अकाउंट का नाम")}</label><input id="social-name" required maxLength={40} value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })} className={field} disabled={busy} /></div>}
      <div><label htmlFor="social-url" className="text-xs font-bold">{text("Profile link", "प्रोफाइल लिंक")}</label><input id="social-url" required maxLength={500} inputMode="url" autoCapitalize="none" autoCorrect="off" value={draft.url} onChange={e => setDraft({ ...draft, url: e.target.value })} className={field} disabled={busy} placeholder={draft.platform === "other" ? "https://www.youtube.com/@name" : `https://${draft.platform === "x" ? "x" : draft.platform}.com/username`} /></div>
      <div className="flex gap-2"><Button type="submit" size="sm" disabled={busy}><Save />{text(busy ? "Saving…" : "Save", busy ? "सेव हो रहा है…" : "सेव करें")}</Button><Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => { setDraft(null); setEditing(null); }}>{text("Cancel", "रद्द करें")}</Button></div>
    </form>}
    {!links.length && !draft && <p className="mt-3 text-xs text-muted-foreground">{text("No social accounts added", "कोई सोशल अकाउंट नहीं जुड़ा है")}</p>}
    <div className="mt-3 divide-y">{links.map((link, index) => { const Icon = icons[link.platform]; return <div key={`${index}-${link.platform}`} className="flex min-w-0 items-center gap-2 py-3"><Icon className="h-5 w-5 shrink-0 text-primary" /><a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1" aria-label={`${text("Open", "खोलें")} ${link.label}`}><span className="flex items-center gap-1 break-words text-sm font-bold">{link.label}<ExternalLink className="h-3 w-3 shrink-0" /></span><span className="block break-all text-xs text-muted-foreground">{link.url}</span></a><Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" disabled={busy} title={text("Edit", "बदलें")} aria-label={`${text("Edit", "बदलें")} ${link.label}`} onClick={() => { setEditing(index); setDraft({ ...link }); }}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-destructive" disabled={busy} title={text("Remove", "हटाएँ")} aria-label={`${text("Remove", "हटाएँ")} ${link.label}`} onClick={() => void persist(links.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button></div>; })}</div>
  </section>;
}