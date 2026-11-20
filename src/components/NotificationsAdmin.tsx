import { useEffect, useState } from "react";
import { Download, Megaphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteNotification, hydrate, sendNotification, useStore } from "@/lib/store";
import { downloadCsv } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { useAccounts } from "@/lib/accounts";

export function NotificationsAdmin() {
  const state = useStore();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [to, setTo] = useState("all");
  const [busy, setBusy] = useState(false);
  const { accounts } = useAccounts();

  useEffect(() => {
    hydrate();
  }, []);

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title aur message dono likhein");
      return;
    }
    setBusy(true);
    try {
      await sendNotification(title.trim().slice(0, 60), body.trim().slice(0, 200), to);
      toast.success("Notification bhej diya");
      setTitle(""); setBody("");
    } catch { toast.error("Notification nahi bheja gaya. Dobara try karein."); }
    finally { setBusy(false); }
  };

  const exportOrders = () => {
    if (state.orders.length === 0) {
      toast.error("Koi order nahi hai");
      return;
    }
    downloadCsv(
      "martigo-orders.csv",
      ["Order ID", "Date", "Customer", "Phone", "Address", "Items", "Coupon", "Discount", "Total", "Payment", "Status", "Rider"],
      state.orders.map((o) => [
        o.id,
        new Date(o.createdAt).toLocaleString("en-IN"),
        o.customer.name,
        o.customer.phone,
        o.customer.address,
        o.items.map((i) => `${i.name} x${i.qty}`).join("; "),
        o.couponCode ?? "",
        o.discount ?? 0,
        o.total,
        o.payment === "cod" ? "COD" : "Online",
        o.status,
        o.rider,
      ]),
    );
    toast.success("Orders CSV download ho gayi");
  };

  const exportProducts = () => {
    downloadCsv(
      "martigo-products.csv",
      ["ID", "Name", "Category", "Price", "MRP", "Unit", "Stock"],
      state.products.map((p) => [p.id, p.name, p.category, p.price, p.mrp, p.unit, p.stock]),
    );
    toast.success("Products CSV download ho gayi");
  };

  const exportCoupons = () => {
    if (state.coupons.length === 0) {
      toast.error("Koi coupon nahi hai");
      return;
    }
    downloadCsv(
      "martigo-coupons.csv",
      ["Code", "Type", "Value", "Min order", "Active", "Used"],
      state.coupons.map((c) => [c.code, c.type, c.value, c.minOrder, c.active ? "Yes" : "No", c.used]),
    );
    toast.success("Coupons CSV download ho gayi");
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="animate-fade-up rounded-2xl border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-bold">
          <Megaphone className="h-4 w-4 text-primary" /> User ko notification bhejo
        </p>
        <label className="mt-3 block text-xs font-semibold">Recipient</label>
        <select aria-label="Notification recipient" value={to} onChange={e => setTo(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"><option value="all">Sabhi users</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name || a.phone} · {a.phone} · {a.role}</option>)}</select>
        <input
          className="mt-3 w-full rounded-xl border bg-background px-3 py-2.5 text-sm"
          placeholder="Title (jese: Aaj ka special offer!)"
          aria-label="Notification title"
          maxLength={60}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          aria-label="Notification message"
          rows={2}
          maxLength={200}
          className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Message (jese: Sabhi fruits par 20% off, aaj hi tak!) "
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <Button
          onClick={send}
          disabled={busy}
          className="mt-3 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground"
        >
          {busy ? "Bhej rahe hain…" : "Send notification"}
        </Button>

      </div>

      <div className="rounded-2xl border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-bold">
          <Download className="h-4 w-4 text-primary" /> Export (Excel/CSV)
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            onClick={exportOrders}
            className="rounded-xl border bg-background px-4 py-2 text-sm font-bold"
          >
            Orders CSV
          </Button>
          <Button
            onClick={exportProducts}
            className="rounded-xl border bg-background px-4 py-2 text-sm font-bold"
          >
            Products CSV
          </Button>
          <Button
            onClick={exportCoupons}
            className="rounded-xl border bg-background px-4 py-2 text-sm font-bold"
          >
            Coupons CSV
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold">Bheji gayi notifications</p>
        {state.notifications.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Abhi koi notification nahi bheja.</p>
        )}
        {state.notifications.filter(n => n.kind !== "activity").map((n) => (
          <div
            key={n.id}
            className="animate-card-in flex items-start gap-3 rounded-2xl border bg-card p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">📢 {n.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {new Date(n.at).toLocaleString("en-IN")} • {n.to === "all" ? "sabhi users" : accounts.find(a => a.id === n.to)?.name || "selected user"}
              </p>
            </div>
            <Button
              onClick={async () => {
                try { await deleteNotification(n.id); toast.success("Notification hata di"); }
                catch { toast.error("Notification nahi hati. Dobara try karein."); }
              }}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              aria-label="Delete notification"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
