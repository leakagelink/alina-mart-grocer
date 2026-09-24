import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Bike, CheckCircle2, Package, PhoneCall, Home } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { STATUS_LABEL, hydrate, inr, useStore, type OrderStatus } from "@/lib/store";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order Tracking — Alina Mart" },
      { name: "description", content: "Live tracking for your Alina Mart delivery." },
      { property: "og:title", content: "Order Tracking — Alina Mart" },
      { property: "og:description", content: "Live tracking for your Alina Mart delivery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackOrder,
});

const STEPS: { key: OrderStatus; icon: typeof Package }[] = [
  { key: "placed", icon: CheckCircle2 },
  { key: "packed", icon: Package },
  { key: "out_for_delivery", icon: Bike },
  { key: "delivered", icon: Home },
];

function TrackOrder() {
  const { id } = Route.useParams();
  const state = useStore();
  useEffect(() => {
    hydrate();
  }, []);

  const order = state.orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">Order nahi mila.</p>
          <Link to="/orders" className="mt-4 inline-block text-sm font-bold text-primary">
            View all orders
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  const activeIndex = STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10 pt-4">
        <div className="animate-fade-up rounded-2xl brand-gradient p-4 text-primary-foreground">
          <p className="text-xs opacity-90">Order #{order.id}</p>
          <p className="mt-1 text-lg font-extrabold">
            {order.status === "delivered" ? "Delivered 🎉" : "Arriving in 15 minutes"}
          </p>
          <p className="mt-1 text-xs opacity-90">{STATUS_LABEL[order.status]}</p>
        </div>

        <div className="mt-4 rounded-2xl border bg-card p-4">
          {STEPS.map((step, i) => {
            const done = order.status === "cancelled" ? false : i <= activeIndex;
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${
                      done ? "animate-pop bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  {i < STEPS.length - 1 && (
                    <span className={`h-8 w-0.5 ${done ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
                <p className={`pt-2 text-sm font-semibold ${done ? "" : "text-muted-foreground"}`}>
                  {STATUS_LABEL[step.key]}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border bg-card p-4">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-xl">
            🛵
          </span>
          <div>
            <p className="text-sm font-bold">{order.rider}</p>
            <p className="text-xs text-muted-foreground">Your delivery partner</p>
          </div>
          <a
            href="tel:+919000000000"
            className="ml-auto flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            <PhoneCall className="h-4 w-4" /> Call
          </a>
        </div>

        <div className="mt-4 rounded-2xl border bg-card p-4">
          <p className="text-sm font-bold">Items</p>
          <div className="mt-2 space-y-2">
            {order.items.map((it) => (
              <div key={it.productId} className="flex items-center gap-3 text-sm">
                <span className="text-xl">{it.emoji}</span>
                <span className="truncate">{it.name}</span>
                <span className="text-muted-foreground">× {it.qty}</span>
                <span className="ml-auto font-semibold">{inr(it.price * it.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t pt-3 text-base font-bold">
            <span>{order.payment === "cod" ? "Pay on delivery" : "Paid online"}</span>
            <span>{inr(order.total)}</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {order.customer.name} • {order.customer.phone}
            <br />
            {order.customer.address}
          </p>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
