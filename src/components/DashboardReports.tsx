import { CalendarDays, IndianRupee, Package, TriangleAlert, TrendingUp } from "lucide-react";
import { inr, useStore } from "@/lib/store";
import { ProductImage } from "@/components/ProductImage";

export function DashboardReports() {
  const state = useStore();

  const valid = state.orders.filter((o) => o.status !== "cancelled");
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const todayOrders = valid.filter((o) => o.createdAt >= todayStart);
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const revenue = valid.reduce((s, o) => s + o.total, 0);
  const avg = valid.length ? Math.round(revenue / valid.length) : 0;

  const days = Array.from({ length: 7 }, (_, i) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (6 - i));
    const end = start.getTime() + 24 * 60 * 60 * 1000;
    const dayOrders = valid.filter((o) => o.createdAt >= start.getTime() && o.createdAt < end);
    return {
      label: start.toLocaleDateString("en-IN", { weekday: "short" }),
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
      count: dayOrders.length,
    };
  });
  const maxRevenue = Math.max(1, ...days.map((d) => d.revenue));

  const sold = new Map<string, { id: string; name: string; emoji: string; qty: number; amount: number }>();
  for (const o of valid) {
    for (const it of o.items) {
      const cur = sold.get(it.productId) ?? { id: it.productId, name: it.name, emoji: it.emoji, qty: 0, amount: 0 };
      cur.qty += it.qty;
      cur.amount += it.qty * it.price;
      sold.set(it.productId, cur);
    }
  }
  const top = [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  const low = state.products.filter((p) => p.stock <= 10).sort((a, b) => a.stock - b.stock);

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashCard icon={CalendarDays} label="Aaj ke orders" value={String(todayOrders.length)} />
        <DashCard icon={IndianRupee} label="Aaj ki sale" value={inr(todayRevenue)} />
        <DashCard icon={TrendingUp} label="Total sale" value={inr(revenue)} />
        <DashCard icon={Package} label="Avg order value" value={inr(avg)} />
      </div>

      <div className="animate-card-in rounded-2xl border bg-card p-4">
        <p className="text-sm font-bold">Pichle 7 din ki sale</p>
        <div className="mt-4 flex h-36 items-end gap-2">
          {days.map((d) => (
            <div key={d.label + String(d.revenue)} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-bold text-muted-foreground">
                {d.revenue > 0 ? inr(d.revenue) : ""}
              </span>
              <div
                className="w-full max-w-10 rounded-t-lg bg-primary"
                style={{ height: `${Math.max(3, (d.revenue / maxRevenue) * 100)}%` }}
                title={`${d.count} orders`}
              />
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="animate-card-in rounded-2xl border bg-card p-4">
          <p className="text-sm font-bold">Sabse zyada bikne wale</p>
          {top.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">Abhi koi sale nahi hui.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {top.map((tp, i) => (
                <div key={tp.name} className="flex items-center gap-2 text-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">
                    {i + 1}
                  </span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface text-base">
                    <ProductImage product={tp} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{tp.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {tp.qty} sold • {inr(tp.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="animate-card-in rounded-2xl border bg-card p-4">
          <p className="flex items-center gap-1 text-sm font-bold">
            <TriangleAlert className="h-4 w-4 text-destructive" /> Low stock (10 ya kam)
          </p>
          {low.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">Sab products ka stock theek hai ✅</p>
          ) : (
            <div className="mt-3 space-y-2">
              {low.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface text-base">
                    <ProductImage product={p} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold ${
                      p.stock === 0
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
}) {
  return (
    <div className="animate-card-in rounded-2xl border bg-card p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-lg font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
