import { useEffect, useState } from "react";
import { Download, Megaphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteNotification, hydrate, sendNotification, useStore } from "@/lib/store";
import { downloadCsv } from "@/lib/export";

export function NotificationsAdmin() {
  const state = useStore();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    hydrate();
  }, []);

  const send = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title aur message dono likhein");
      return;
    }
    sendNotification(title.trim().slice(0, 60), body.trim().slice(0, 200));
    toast.success("Notification bhej diya — customer ke My Orders page par dikhega");
    setTitle("");
    setBody("");
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
          <Megaphone className="h-4 w-4 text-primary" /> Customer ko notification bhejo
        </p>
        <input
          className="mt-3 w-full rounded-xl border bg-background px-3 py-2.5 text-sm"
          placeholder="Title (jese: Aaj ka special offer!)"
          maxLength={60}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          rows={2}
          maxLength={200}
          className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Message (jese: Sabhi fruits par 20% off, aaj hi tak!) "
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          onClick={send}
          className="mt-3 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground"
        >
          Send notification
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          Demo mode: notification is device par save hota hai aur customer ke My Orders page par
          dikhta hai. Live push/SMS backend ke baad judega.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-bold">
          <Download className="h-4 w-4 text-primary" /> Export (Excel/CSV)
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={exportOrders}
            className="rounded-xl border bg-background px-4 py-2 text-sm font-bold"
          >
            Orders CSV
          </button>
          <button
            onClick={exportProducts}
            className="rounded-xl border bg-background px-4 py-2 text-sm font-bold"
          >
            Products CSV
          </button>
          <button
            onClick={exportCoupons}
            className="rounded-xl border bg-background px-4 py-2 text-sm font-bold"
          >
            Coupons CSV
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold">Bheji gayi notifications</p>
        {state.notifications.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Abhi koi notification nahi bheja.</p>
        )}
        {state.notifications.map((n, i) => (
          <div
            key={n.id}
            className="animate-card-in flex items-start gap-3 rounded-2xl border bg-card p-4"
            style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">📢 {n.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {new Date(n.at).toLocaleString("en-IN")} • sabhi customers ko
              </p>
            </div>
            <button
              onClick={() => {
                deleteNotification(n.id);
                toast.success("Notification hata di");
              }}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              aria-label="Delete notification"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
