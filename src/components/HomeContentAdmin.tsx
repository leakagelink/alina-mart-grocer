import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { homeContent, moveItem, type HomeContent } from "@/lib/home-content";
import { saveHomeContent, useStore } from "@/lib/store";

export function HomeContentAdmin() {
  const state = useStore();
  const [draft, setDraft] = useState<HomeContent>(() => homeContent(state.settings.home));
  const [tab, setTab] = useState<keyof HomeContent>("banners");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (!dirty) setDraft(homeContent(state.settings.home)); }, [state.settings.home, dirty]);
  function update(next: HomeContent) { setDraft(next); setDirty(true); }
  function patch(index: number, key: string, value: unknown) {
    update({ ...draft, [tab]: draft[tab].map((item, i) => i === index ? { ...item, [key]: value } : item) });
  }
  function add() {
    const id = crypto.randomUUID();
    const item = tab === "banners" ? { id, title: "", titleHi: "", subtitle: "", subtitleHi: "", image: "", category: "", visible: true }
      : tab === "categories" ? { id, name: "", nameHi: "", group: "Grocery & Kitchen", groupHi: "किराना और रसोई", image: "", productId: "", emoji: "🛍️", visible: true }
      : { id, title: "", titleHi: "", category: "", productIds: [], visible: true };
    update({ ...draft, [tab]: [...draft[tab], item] });
  }
  const categories = draft.categories;
  return <section className="mt-6 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Home screen</h2>
      <Button disabled={saving || !dirty} onClick={async () => {
        const all = [...draft.banners, ...draft.categories, ...draft.sections];
        if (all.some(item => !("name" in item ? item.name : item.title).trim())) { toast.error("Har item ka naam ya title daalein"); return; }
        if (draft.banners.some(b => !/^https:\/\//.test(b.image)) || draft.categories.some(c => c.image && !/^https:\/\//.test(c.image))) { toast.error("Photo ka valid HTTPS URL daalein"); return; }
        setSaving(true);
        try { await saveHomeContent(draft); setDirty(false); toast.success("Home screen save ho gayi"); } catch { toast.error("Save nahi hua, dobara koshish karein"); } finally { setSaving(false); }
      }}><Save />{saving ? "Saving…" : "Save home"}</Button></div>
    <div className="flex flex-wrap gap-2">{(["banners", "categories", "sections"] as const).map(key => <Button key={key} variant={tab === key ? "default" : "outline"} onClick={() => setTab(key)}>{key === "banners" ? "Banners" : key === "categories" ? "Categories" : "Product sections"}</Button>)}</div>
    <div className="space-y-4">{draft[tab].map((item, index) => <article key={item.id} className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center justify-between gap-2"><h3 className="min-w-0 truncate font-bold">{index + 1}. {"name" in item ? item.name || "New category" : item.title || "New item"}</h3><div className="flex shrink-0 gap-1">
        <Button size="icon" variant="ghost" title="Move up" disabled={index === 0} onClick={() => update({ ...draft, [tab]: moveItem(draft[tab] as typeof item[], index, -1) })}><ArrowUp /></Button>
        <Button size="icon" variant="ghost" title="Move down" disabled={index === draft[tab].length - 1} onClick={() => update({ ...draft, [tab]: moveItem(draft[tab] as typeof item[], index, 1) })}><ArrowDown /></Button>
        <Button size="icon" variant="ghost" title={item.visible ? "Hide" : "Show"} onClick={() => patch(index, "visible", !item.visible)}>{item.visible ? <Eye /> : <EyeOff />}</Button>
        <Button size="icon" variant="ghost" title="Delete" onClick={() => { if (window.confirm("Ye home item delete karein?")) update({ ...draft, [tab]: draft[tab].filter((_, i) => i !== index) }); }}><Trash2 /></Button>
      </div></div>
      <div className="grid gap-3 sm:grid-cols-2">
        {("name" in item ? ["id", "name", "nameHi", "group", "groupHi", "image"] : "subtitle" in item ? ["title", "titleHi", "subtitle", "subtitleHi", "image"] : ["title", "titleHi"]).map(key => <label key={key} className="text-xs font-semibold">{({ id: "Category ID", name: "Name (English)", nameHi: "नाम (हिन्दी)", group: "Group (English)", groupHi: "समूह (हिन्दी)", title: "Title (English)", titleHi: "शीर्षक (हिन्दी)", subtitle: "Subtitle (English)", subtitleHi: "विवरण (हिन्दी)", image: "Photo HTTPS URL" } as Record<string,string>)[key]}<Input className="mt-1" value={String((item as unknown as Record<string, unknown>)[key] ?? "")} onChange={e => patch(index, key, e.target.value)} /></label>)}
        {"category" in item && <label className="text-xs font-semibold">Category<select className="mt-1 h-9 w-full border bg-background px-2" value={item.category} onChange={e => patch(index, "category", e.target.value)}><option value="">All products</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
        {"productId" in item && <label className="text-xs font-semibold">Category photo from product<select className="mt-1 h-9 w-full border bg-background px-2" value={item.productId} onChange={e => patch(index, "productId", e.target.value)}><option value="">None</option>{state.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
      </div>
      {"productIds" in item && <div className="mt-4 grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">{state.products.map(p => <label key={p.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.productIds.includes(p.id)} onChange={e => patch(index, "productIds", e.target.checked ? [...item.productIds, p.id] : item.productIds.filter(id => id !== p.id))} />{p.name}</label>)}</div>}
    </article>)}</div>
    <Button variant="outline" onClick={add}><Plus />Add {tab === "categories" ? "category" : tab === "banners" ? "banner" : "section"}</Button>
  </section>;
}