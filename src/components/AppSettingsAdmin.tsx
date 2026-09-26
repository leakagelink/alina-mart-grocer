import { useEffect, useState } from "react";
import { toast } from "sonner";
import { hydrate, updateSettings, useStore } from "@/lib/store";

export function AppSettingsAdmin() {
  const state = useStore();
  const s = state.settings;
  const [form, setForm] = useState({
    deliveryFee: String(s.deliveryFee),
    freeDeliveryAbove: String(s.freeDeliveryAbove),
    deliveryMinutes: String(s.deliveryMinutes),
    announcement: s.announcement,
  });

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    setForm({
      deliveryFee: String(s.deliveryFee),
      freeDeliveryAbove: String(s.freeDeliveryAbove),
      deliveryMinutes: String(s.deliveryMinutes),
      announcement: s.announcement,
    });
  }, [s.deliveryFee, s.freeDeliveryAbove, s.deliveryMinutes, s.announcement]);

  const save = () => {
    const deliveryFee = Number(form.deliveryFee);
    const freeDeliveryAbove = Number(form.freeDeliveryAbove);
    const deliveryMinutes = Number(form.deliveryMinutes);
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
      toast.error("Delivery fee sahi daalein");
      return;
    }
    updateSettings({
      deliveryFee,
      freeDeliveryAbove: Number.isFinite(freeDeliveryAbove) ? freeDeliveryAbove : 0,
      deliveryMinutes: Number.isFinite(deliveryMinutes) && deliveryMinutes > 0 ? deliveryMinutes : 15,
      announcement: form.announcement.trim().slice(0, 120),
    });
    toast.success("Settings save ho gayi");
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="animate-fade-up rounded-2xl border bg-card p-4">
        <p className="text-sm font-bold">Delivery charges & time</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <label className="text-xs font-bold">
            Delivery fee (₹)
            <input
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm font-normal"
              inputMode="numeric"
              value={form.deliveryFee}
              onChange={(e) => setForm({ ...form, deliveryFee: e.target.value.replace(/\D/g, "") })}
            />
          </label>
          <label className="text-xs font-bold">
            Free delivery above (₹)
            <input
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm font-normal"
              inputMode="numeric"
              value={form.freeDeliveryAbove}
              onChange={(e) =>
                setForm({ ...form, freeDeliveryAbove: e.target.value.replace(/\D/g, "") })
              }
            />
          </label>
          <label className="text-xs font-bold">
            Delivery time (minutes)
            <input
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm font-normal"
              inputMode="numeric"
              value={form.deliveryMinutes}
              onChange={(e) =>
                setForm({ ...form, deliveryMinutes: e.target.value.replace(/\D/g, "") })
              }
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Cart, checkout aur order page sab jagah ye values apply hongi.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <p className="text-sm font-bold">Payment methods</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            onClick={() => {
              updateSettings({ codEnabled: !s.codEnabled });
              toast.success(s.codEnabled ? "COD band kar diya" : "COD on kar diya");
            }}
            className={`rounded-xl border p-3 text-left text-sm font-semibold ${
              s.codEnabled ? "border-primary bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Cash on Delivery: {s.codEnabled ? "ON ✅" : "OFF ❌"}
          </button>
          <button
            onClick={() => {
              updateSettings({ onlineEnabled: !s.onlineEnabled });
              toast.success(s.onlineEnabled ? "Online payment band kar diya" : "Online payment on kar diya");
            }}
            className={`rounded-xl border p-3 text-left text-sm font-semibold ${
              s.onlineEnabled
                ? "border-primary bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Online (UPI/Card): {s.onlineEnabled ? "ON ✅" : "OFF ❌"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <p className="text-sm font-bold">Home page announcement</p>
        <textarea
          rows={2}
          maxLength={120}
          className="mt-3 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Jese: Aaj 20% off sabhi fruits par!"
          value={form.announcement}
          onChange={(e) => setForm({ ...form, announcement: e.target.value })}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Khali chhoda to banner nahi dikhega. {form.announcement.length}/120
        </p>
      </div>

      <button
        onClick={save}
        className="rounded-xl bg-secondary px-6 py-2.5 text-sm font-bold text-secondary-foreground"
      >
        Save settings
      </button>
    </div>
  );
}
