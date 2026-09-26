import { useState } from "react";
import { BadgePercent, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCoupon, inr, toggleCoupon, upsertCoupon, useStore, type Coupon } from "@/lib/store";

const emptyForm = { code: "", type: "flat" as Coupon["type"], value: "", minOrder: "" };

export function CouponsAdmin() {
  const state = useStore();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);

  const save = () => {
    const code = form.code.trim().toUpperCase();
    const value = Number(form.value);
    const minOrder = Number(form.minOrder || 0);
    if (!code) {
      toast.error("Coupon code likhein (jese FIRST50)");
      return;
    }
    if (form.type !== "freedel" && (!Number.isFinite(value) || value <= 0)) {
      toast.error("Coupon value 0 se zyada honi chahiye");
      return;
    }
    const existing = state.coupons.find((c) => c.code === code);
    if (!editing && existing) {
      toast.error("Ye coupon code pehle se bana hua hai");
      return;
    }
    upsertCoupon({
      code,
      type: form.type,
      value: form.type === "freedel" ? 0 : value,
      minOrder: Number.isFinite(minOrder) ? Math.max(0, minOrder) : 0,
      active: editing ? (existing?.active ?? true) : true,
      used: existing?.used ?? 0,
    });
    toast.success(editing ? "Coupon updated" : "Coupon ban gaya — ab customer checkout me use kar sakta hai");
    setEditing(null);
    setForm(emptyForm);
  };

  const startEdit = (c: Coupon) => {
    setEditing(c.code);
    setForm({
      code: c.code,
      type: c.type,
      value: c.type === "freedel" ? "" : String(c.value),
      minOrder: String(c.minOrder),
    });
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="animate-fade-up rounded-2xl border bg-card p-4">
        <p className="text-sm font-bold">{editing ? `Edit coupon ${editing}` : "Naya coupon banao"}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <input
            className="rounded-xl border bg-background px-3 py-2 text-sm uppercase"
            placeholder="CODE (FIRST50)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            maxLength={15}
          />
          <select
            className="rounded-xl border bg-background px-3 py-2 text-sm"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as Coupon["type"] })}
          >
            <option value="flat">Flat ₹ off</option>
            <option value="percent">% off</option>
            <option value="freedel">Free delivery</option>
          </select>
          <input
            className="rounded-xl border bg-background px-3 py-2 text-sm"
            placeholder={form.type === "freedel" ? "—" : form.type === "percent" ? "Value %" : "Value ₹"}
            inputMode="numeric"
            disabled={form.type === "freedel"}
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value.replace(/\D/g, "") })}
          />
          <input
            className="rounded-xl border bg-background px-3 py-2 text-sm"
            placeholder="Min order ₹ (0 = koi limit nahi)"
            inputMode="numeric"
            value={form.minOrder}
            onChange={(e) => setForm({ ...form, minOrder: e.target.value.replace(/\D/g, "") })}
          />
        </div>
        <button
          onClick={save}
          className="mt-3 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground"
        >
          {editing ? "Save changes" : "Add coupon"}
        </button>
        {editing && (
          <button
            onClick={() => {
              setEditing(null);
              setForm(emptyForm);
            }}
            className="ml-2 mt-3 rounded-xl bg-muted px-4 py-2 text-sm font-bold text-muted-foreground"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="space-y-2">
        {state.coupons.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Koi coupon nahi hai.</p>
        )}
        {state.coupons.map((c, i) => (
          <div
            key={c.code}
            className="animate-card-in flex items-center gap-3 rounded-2xl border bg-card p-4"
            style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
          >
            <BadgePercent className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">
                {c.code}
                {!c.active && (
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                    PAUSED
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {c.type === "percent"
                  ? `${c.value}% off`
                  : c.type === "flat"
                    ? `${inr(c.value)} off`
                    : "Free delivery"}
                {c.minOrder > 0 ? ` • min order ${inr(c.minOrder)}` : ""} • {c.used}× use hua
              </p>
            </div>
            <button
              onClick={() => toggleCoupon(c.code)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${
                c.active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {c.active ? "Active" : "Paused"}
            </button>
            <button
              onClick={() => startEdit(c)}
              className="shrink-0 text-muted-foreground hover:text-primary"
              aria-label="Edit coupon"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (!window.confirm(`${c.code} delete karein?`)) return;
                deleteCoupon(c.code);
                if (editing === c.code) {
                  setEditing(null);
                  setForm(emptyForm);
                }
                toast.success("Coupon removed");
              }}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              aria-label="Delete coupon"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
