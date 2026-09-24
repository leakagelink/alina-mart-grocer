import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  MapPin,
  PackageOpen,
  Phone,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  STATUS_LABEL,
  hydrate,
  inr,
  setOrderStatus,
  useStore,
  type Order,
} from "@/lib/store";

export const Route = createFileRoute("/delivery")({
  head: () => ({
    meta: [
      { title: "Delivery Partner — Alina Mart" },
      {
        name: "description",
        content: "Alina Mart delivery partner panel: pickups, deliveries and COD collection.",
      },
      { property: "og:title", content: "Delivery Partner — Alina Mart" },
      { property: "og:description", content: "Pickups, deliveries and COD collection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DeliveryPanel,
});

const RIDER = { name: "Ravi Kumar", phone: "9876543210", vehicle: "EV Scooter • DL 3S AB 1234" };

function DeliveryPanel() {
  const state = useStore();

  useEffect(() => {
    hydrate();
  }, []);

  const ready = useMemo(() => state.orders.filter((o) => o.status === "packed"), [state]);
  const active = useMemo(
    () => state.orders.filter((o) => o.status === "out_for_delivery"),
    [state],
  );
  const deliveredToday = useMemo(
    () =>
      state.orders.filter(
        (o) => o.status === "delivered" && Date.now() - o.createdAt < 24 * 60 * 60 * 1000,
      ),
    [state],
  );
  const codDue = useMemo(
    () => active.filter((o) => o.payment === "cod").reduce((s, o) => s + o.total, 0),
    [active],
  );

  const pickup = (o: Order) => {
    setOrderStatus(o.id, "out_for_delivery");
    toast.success(`#${o.id} — Picked up`);
  };
  const deliver = (o: Order) => {
    setOrderStatus(o.id, "delivered");
    toast.success(`#${o.id} — Delivered`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 bg-primary text-primary-foreground shadow-lg">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
          <Link
            to="/"
            className="rounded-full bg-primary-foreground/15 p-2"
            aria-label="Customer app par wapas jayein"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <p className="text-sm font-extrabold">Delivery Partner</p>
            <p className="text-xs opacity-80">
              {RIDER.name} • {RIDER.vehicle}
            </p>
          </div>
          <div className="rounded-xl bg-primary-foreground/15 p-2">
            <Bike className="h-5 w-5" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-12 pt-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={PackageOpen} label="Ready to pick" value={String(ready.length)} />
          <Stat icon={Bike} label="On the way" value={String(active.length)} />
          <Stat icon={CheckCircle2} label="Delivered (24h)" value={String(deliveredToday.length)} />
          <Stat icon={Wallet} label="COD to collect" value={inr(codDue)} />
        </div>

        <Section title="Pickup karein" count={ready.length}>
          {ready.length === 0 ? (
            <Empty text="Koi packed order nahi — admin se pack hone par yahan dikhega." />
          ) : (
            ready.map((o, i) => (
              <OrderCard
                key={o.id}
                order={o}
                delay={i}
                action={{
                  label: "Picked up",
                  onClick: () => pickup(o),
                  className: "bg-primary text-primary-foreground",
                }}
              />
            ))
          )}
        </Section>

        <Section title="Deliveries" count={active.length}>
          {active.length === 0 ? (
            <Empty text="Abhi koi delivery on the way nahi hai." />
          ) : (
            active.map((o, i) => (
              <OrderCard
                key={o.id}
                order={o}
                delay={i}
                action={{
                  label:
                    o.payment === "cod"
                      ? `Deliver • ${inr(o.total)} cash lena hai`
                      : "Delivered",
                  onClick: () => deliver(o),
                  className:
                    o.payment === "cod"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-primary text-primary-foreground",
                }}
              />
            ))
          )}
        </Section>

        {deliveredToday.length > 0 && (
          <Section title="Aaj delivered" count={deliveredToday.length}>
            {deliveredToday.map((o, i) => (
              <OrderCard key={o.id} order={o} delay={i} done />
            ))}
          </Section>
        )}
      </main>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Bike;
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

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-extrabold">{title}</h2>
        <span className="rounded-lg bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
          {count}
        </span>
      </div>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function OrderCard({
  order,
  delay,
  action,
  done,
}: {
  order: Order;
  delay: number;
  action?: { label: string; onClick: () => void; className: string };
  done?: boolean;
}) {
  return (
    <div
      className="animate-card-in rounded-2xl border bg-card p-4"
      style={{ animationDelay: `${Math.min(delay, 8) * 50}ms` }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-extrabold">#{order.id}</span>
        <span
          className={`rounded-lg px-2 py-1 text-xs font-bold text-accent-foreground ${
            done ? "bg-muted" : "bg-accent"
          }`}
        >
          {done ? "Delivered" : STATUS_LABEL[order.status]}
        </span>
        <span className="ml-auto text-sm font-extrabold">{inr(order.total)}</span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {order.items.map((i) => `${i.emoji} ${i.name} ×${i.qty}`).join(", ")}
      </p>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted p-3">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{order.customer.name}</p>
          <p className="text-xs text-muted-foreground">{order.customer.address}</p>
        </div>
        <a
          href={`tel:${order.customer.phone}`}
          className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground"
          aria-label={`Customer ${order.customer.name} ko call karein`}
        >
          <Phone className="h-3.5 w-3.5" />
          Call
        </a>
      </div>

      {order.payment === "cod" && !done && (
        <p className="mt-2 text-xs font-semibold text-accent-foreground bg-accent rounded-lg px-2 py-1.5 inline-block">
          COD: {inr(order.total)} customer se lena hai
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className={`mt-3 w-full rounded-xl py-2.5 text-sm font-extrabold transition-transform active:scale-95 ${action.className}`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
