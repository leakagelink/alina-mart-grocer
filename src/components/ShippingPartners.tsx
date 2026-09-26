import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

export type ShippingPartner = {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  trackingUrl: string;
  active: boolean;
};

const KEY = "alina-shipping-v1";
let partners: ShippingPartner[] = [];
let loaded = false;
const subs = new Set<() => void>();
const EMPTY: ShippingPartner[] = [];

function save(next: ShippingPartner[]) {
  partners = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  subs.forEach((f) => f());
}
function load() {
  if (loaded) return;
  loaded = true;
  try { partners = JSON.parse(localStorage.getItem(KEY) ?? "[]") as ShippingPartner[]; } catch { partners = []; }
  subs.forEach((f) => f());
}
function usePartners() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => partners, () => EMPTY);
}

const PRESETS = [
  { name: "Shiprocket", apiUrl: "https://apiv2.shiprocket.in/v1/external", trackingUrl: "https://shiprocket.co/tracking/{awb}" },
  { name: "Delhivery", apiUrl: "https://track.delhivery.com/api", trackingUrl: "https://www.delhivery.com/track/package/{awb}" },
  { name: "Porter", apiUrl: "https://pfe-apigw.porter.in/v1", trackingUrl: "" },
  { name: "Borzo (WeFast)", apiUrl: "https://robot-in.borzodelivery.com/api/business/1.6", trackingUrl: "" },
];

const blank = { name: "", apiUrl: "", apiKey: "", trackingUrl: "" };
const mask = (k: string) => (k.length <= 4 ? "••••" : "••••••" + k.slice(-4));

export function ShippingPartners() {
  const list = usePartners();
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState<string | null>(null);
  useEffect(load, []);

  const submit = () => {
    if (!form.name.trim() || !/^https?:\/\//.test(form.apiUrl.trim())) {
      toast.error("Naam aur sahi API URL (https://...) zaroori hai");
      return;
    }
    const item: ShippingPartner = {
      id: editId ?? "sp" + Date.now(),
      name: form.name.trim().slice(0, 50),
      apiUrl: form.apiUrl.trim().slice(0, 300),
      apiKey: form.apiKey.trim().slice(0, 500),
      trackingUrl: form.trackingUrl.trim().slice(0, 300),
      active: editId ? (list.find((p) => p.id === editId)?.active ?? true) : true,
    };
    save(editId ? list.map((p) => (p.id === editId ? item : p)) : [...list, item]);
    toast.success(editId ? "Partner update ho gaya" : "Shipping partner add ho gaya");
    setForm(blank);
    setEditId(null);
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-2xl border bg-card p-4">
        <p className="text-sm font-bold">{editId ? "Edit shipping partner" : "Add shipping partner"}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.name} onClick={() => setForm({ ...form, ...p })}
              className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
              + {p.name}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input className="rounded-xl border bg-background px-3 py-2 text-sm" placeholder="Partner name"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="rounded-xl border bg-background px-3 py-2 text-sm" placeholder="API base URL"
            value={form.apiUrl} onChange={(e) => setForm({ ...form, apiUrl: e.target.value })} />
          <input className="rounded-xl border bg-background px-3 py-2 text-sm" placeholder="API key / token" type="password"
            value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
          <input className="rounded-xl border bg-background px-3 py-2 text-sm" placeholder="Tracking URL (use {awb})"
            value={form.trackingUrl} onChange={(e) => setForm({ ...form, trackingUrl: e.target.value })} />
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={submit} className="rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground">
            {editId ? "Save changes" : "Add partner"}
          </button>
          {editId && (
            <button onClick={() => { setEditId(null); setForm(blank); }}
              className="rounded-xl bg-muted px-4 py-2 text-sm font-bold text-muted-foreground">Cancel</button>
          )}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Demo mode: API key sirf is device par save hoti hai. Live shipment booking ke liye backend chahiye.
        </p>
      </div>

      {list.map((p) => (
        <div key={p.id} className="animate-card-in rounded-2xl border bg-card p-3">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-bold">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">{p.apiUrl}</p>
              <p className="text-xs text-muted-foreground">Key: {p.apiKey ? mask(p.apiKey) : "—"}</p>
            </div>
            <button
              onClick={() => save(list.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)))}
              className={`rounded-full px-3 py-1 text-xs font-bold ${p.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {p.active ? "Active" : "Inactive"}
            </button>
          </div>
          <div className="mt-2 flex gap-2 text-xs font-bold">
            <button onClick={() => toast.success(`${p.name}: settings valid (demo test)`)} className="rounded-lg bg-muted px-3 py-1.5 text-muted-foreground">Test connection</button>
            <button onClick={() => { setEditId(p.id); setForm({ name: p.name, apiUrl: p.apiUrl, apiKey: p.apiKey, trackingUrl: p.trackingUrl }); }}
              className="rounded-lg bg-secondary px-3 py-1.5 text-secondary-foreground">Edit</button>
            <button onClick={() => { if (window.confirm(`${p.name} hataein?`)) { save(list.filter((x) => x.id !== p.id)); toast.success("Partner hata diya"); } }}
              className="rounded-lg bg-destructive px-3 py-1.5 text-destructive-foreground">Delete</button>
          </div>
        </div>
      ))}
      {!list.length && <p className="py-6 text-center text-sm text-muted-foreground">Abhi koi shipping partner nahi jode gaye</p>}
    </div>
  );
}
