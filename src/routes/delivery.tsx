import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Bike,
  CheckCircle2,
  IndianRupee,
  LogOut,
  MapPin,
  Navigation,
  PackageOpen,
  Phone,
  Power,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  STATUS_LABEL,
  assignRider,
  hydrate,
  inr,
  setOrderStatus,
  useStore,
  type Order,
} from "@/lib/store";
import { currentAccount, hydrateAccounts, logOut, useAccounts } from "@/lib/accounts";

export const Route = createFileRoute("/delivery")({
  head: () => ({
    meta: [
      { title: "Delivery Partner — Alina Mart" },
      {
        name: "description",
        content: "Alina Mart delivery partner app: login, pickups, navigation, OTP delivery and earnings.",
      },
      { property: "og:title", content: "Delivery Partner — Alina Mart" },
      { property: "og:description", content: "Pickups, navigation, OTP delivery and earnings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DeliveryApp,
});

type Rider = { id: string; name: string; phone: string; vehicle: string };
const PER_DELIVERY = 30;
const ONLINE_KEY = "alina-rider-online";

const otpFor = (o: Order) => o.customer.phone.replace(/\D/g, "").slice(-4) || "0000";

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.25].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.2, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.2);
    });
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    /* ignore */
  }
}

function DeliveryApp() {
  const acc = useAccounts();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    hydrate();
    hydrateAccounts();
    setReady(true);
  }, []);
  const me = currentAccount(acc);
  if (!ready) return null;
  if (!me || me.role !== "delivery")
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary p-4">
        <div className="animate-fade-up w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl">
          <Bike className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-2 text-xl font-extrabold">Alina Mart Rider</h1>
          <p className="text-sm text-muted-foreground">Delivery partner account se login ya sign up kariye</p>
          <Link to="/signup" className="mt-4 block rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground">Sign up / Login</Link>
          <p className="mt-3 text-[11px] text-muted-foreground">Demo rider: 9876543210 / PIN 1234</p>
        </div>
      </div>
    );
  if (me.kycStatus !== "approved")
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary p-4">
        <div className="animate-fade-up w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl">
          <p className="text-lg font-extrabold">KYC approval zaroori hai</p>
          <p className="text-sm text-muted-foreground">Admin se KYC approve hone ke baad hi orders milenge.</p>
          <Link to="/kyc" className="mt-4 block rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground">KYC status dekhiye</Link>
        </div>
      </div>
    );
  const rider: Rider = {
    id: me.id,
    name: me.name,
    phone: me.phone,
    vehicle: me.kyc ? `${me.kyc.vehicleType} • ${me.kyc.vehicleNumber}` : "Bike",
  };
  return <Panel rider={rider} onLogout={() => logOut()} />;
}

function Panel({ rider, onLogout }: { rider: Rider; onLogout: () => void }) {
  const state = useStore();
  const [online, setOnline] = useState(true);
  const [tab, setTab] = useState<"orders" | "earnings">("orders");
  const [otpOrder, setOtpOrder] = useState<Order | null>(null);

  useEffect(() => {
    setOnline(localStorage.getItem(ONLINE_KEY) !== "0");
  }, []);
  const toggleOnline = () => {
    const n = !online;
    setOnline(n);
    localStorage.setItem(ONLINE_KEY, n ? "1" : "0");
    toast(n ? "Aap Online hain — orders milenge" : "Aap Offline hain");
  };

  const readyList = useMemo(() => state.orders.filter((o) => o.status === "packed"), [state]);
  const mine = useMemo(() => state.orders.filter((o) => o.rider === rider.name), [state, rider]);
  const active = mine.filter((o) => o.status === "out_for_delivery");
  const delivered = mine.filter((o) => o.status === "delivered");
  const today = delivered.filter((o) => Date.now() - o.createdAt < 864e5);
  const week = delivered.filter((o) => Date.now() - o.createdAt < 7 * 864e5);
  const codDue = active.filter((o) => o.payment === "cod").reduce((s, o) => s + o.total, 0);
  const codCollected = today.filter((o) => o.payment === "cod").reduce((s, o) => s + o.total, 0);

  // new order alert
  const prev = useRef(readyList.length);
  useEffect(() => {
    if (online && readyList.length > prev.current) {
      beep();
      toast.success("🔔 Naya order pickup ke liye ready!");
    }
    prev.current = readyList.length;
  }, [readyList.length, online]);

  // poll other tabs (admin in another tab)
  useEffect(() => {
    const onStorage = () => hydrate();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const pickup = (o: Order) => {
    assignRider(o.id, rider.name);
    toast.success(`#${o.id} — Picked up`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 bg-primary text-primary-foreground shadow-lg">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
          <Link to="/" className="rounded-full bg-primary-foreground/15 p-2" aria-label="Wapas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold">{rider.name}</p>
            <p className="truncate text-xs opacity-80">{rider.vehicle}</p>
          </div>
          <button
            onClick={toggleOnline}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold ${
              online ? "bg-secondary text-secondary-foreground" : "bg-primary-foreground/20"
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            {online ? "Online" : "Offline"}
          </button>
          <button onClick={onLogout} className="rounded-full bg-primary-foreground/15 p-2" aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <div className="mx-auto flex w-full max-w-3xl px-4 pb-2">
          {(["orders", "earnings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-extrabold ${
                tab === t ? "bg-primary-foreground text-primary" : "opacity-80"
              }`}
            >
              {t === "orders" ? "Orders" : "Earnings"}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-12 pt-4">
        {tab === "earnings" ? (
          <Earnings today={today} week={week} codCollected={codCollected} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat icon={PackageOpen} label="Ready to pick" value={String(readyList.length)} />
              <Stat icon={Bike} label="Meri deliveries" value={String(active.length)} />
              <Stat icon={CheckCircle2} label="Aaj delivered" value={String(today.length)} />
              <Stat icon={Wallet} label="COD to collect" value={inr(codDue)} />
            </div>

            {active[0] && <MapCard order={active[0]} />}

            <Section title="Pickup karein" count={online ? readyList.length : 0} icon={Bell}>
              {!online ? (
                <Empty text="Aap Offline hain. Orders dekhne ke liye Online karein." />
              ) : readyList.length === 0 ? (
                <Empty text="Koi packed order nahi — naya order aate hi ring bajegi." />
              ) : (
                readyList.map((o, i) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    delay={i}
                    action={{ label: "Accept & Pick up", onClick: () => pickup(o), className: "bg-primary text-primary-foreground" }}
                  />
                ))
              )}
            </Section>

            <Section title="Meri deliveries" count={active.length}>
              {active.length === 0 ? (
                <Empty text="Abhi koi delivery on the way nahi hai." />
              ) : (
                active.map((o, i) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    delay={i}
                    navigate
                    action={{
                      label: o.payment === "cod" ? `Deliver • ${inr(o.total)} cash lena hai` : "Deliver (OTP)",
                      onClick: () => setOtpOrder(o),
                      className: o.payment === "cod" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground",
                    }}
                    extra={
                      <button
                        onClick={() => {
                          setOrderStatus(o.id, "packed");
                          toast("Order wapas store ko diya");
                        }}
                        className="mt-2 w-full text-xs font-bold text-muted-foreground underline"
                      >
                        Customer nahi mila — return to store
                      </button>
                    }
                  />
                ))
              )}
            </Section>

            {today.length > 0 && (
              <Section title="Aaj delivered" count={today.length}>
                {today.map((o, i) => (
                  <OrderCard key={o.id} order={o} delay={i} done />
                ))}
              </Section>
            )}
          </>
        )}
      </main>

      {otpOrder && <OtpDialog order={otpOrder} onClose={() => setOtpOrder(null)} />}
    </div>
  );
}

function MapCard({ order }: { order: Order }) {
  const q = encodeURIComponent(order.customer.address);
  return (
    <div className="animate-card-in mt-4 overflow-hidden rounded-2xl border bg-card">
      <iframe
        title="Delivery map"
        src={`https://maps.google.com/maps?q=${q}&z=15&output=embed`}
        className="h-48 w-full border-0"
        loading="lazy"
      />
      <div className="flex items-center gap-2 p-3">
        <MapPin className="h-4 w-4 shrink-0 text-primary" />
        <p className="flex-1 truncate text-xs font-bold">{order.customer.address}</p>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=two-wheeler`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
        >
          <Navigation className="h-3.5 w-3.5" /> Navigate
        </a>
      </div>
    </div>
  );
}

function OtpDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const [otp, setOtp] = useState("");
  const [cash, setCash] = useState(order.payment !== "cod");
  const confirm = () => {
    if (otp !== otpFor(order)) { toast.error("OTP galat hai"); return; }
    if (!cash) { toast.error("Pehle cash collect confirm karein"); return; }
    setOrderStatus(order.id, "delivered");
    beep();
    toast.success(`#${order.id} delivered • +${inr(PER_DELIVERY)} kamaye`);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 sm:items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="animate-fade-up w-full max-w-sm rounded-t-3xl bg-card p-5 sm:rounded-3xl">
        <h3 className="text-base font-extrabold">Delivery confirm karein</h3>
        <p className="text-xs text-muted-foreground">
          Customer se 4-digit OTP poochiye. (Demo: customer ke phone ke last 4 digit — {otpFor(order)})
        </p>
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          maxLength={4}
          inputMode="numeric"
          autoFocus
          className="mt-3 w-full rounded-xl border bg-background px-3 py-3 text-center text-2xl font-extrabold tracking-[0.5em]"
        />
        {order.payment === "cod" && (
          <label className="mt-3 flex items-center gap-2 rounded-xl bg-accent p-3 text-sm font-bold text-accent-foreground">
            <input type="checkbox" checked={cash} onChange={(e) => setCash(e.target.checked)} />
            {inr(order.total)} cash collect kar liya
          </label>
        )}
        <button onClick={confirm} className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground active:scale-95">
          Delivered
        </button>
      </div>
    </div>
  );
}

function Earnings({ today, week, codCollected }: { today: Order[]; week: Order[]; codCollected: number }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    const start = d.getTime();
    const n = week.filter((o) => o.createdAt >= start && o.createdAt < start + 864e5).length;
    return { label: d.toLocaleDateString("en-IN", { weekday: "short" }), amt: n * PER_DELIVERY };
  });
  const max = Math.max(PER_DELIVERY, ...days.map((d) => d.amt));
  return (
    <div className="space-y-4">
      <div className="animate-card-in rounded-3xl bg-primary p-5 text-primary-foreground">
        <p className="text-xs opacity-80">Aaj ki kamai</p>
        <p className="text-3xl font-extrabold">{inr(today.length * PER_DELIVERY)}</p>
        <p className="text-xs opacity-80">{today.length} deliveries × {inr(PER_DELIVERY)}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat icon={IndianRupee} label="Is hafte" value={inr(week.length * PER_DELIVERY)} />
        <Stat icon={Wallet} label="COD jama karna hai (aaj)" value={inr(codCollected)} />
      </div>
      <div className="animate-card-in rounded-2xl border bg-card p-4">
        <p className="text-sm font-extrabold">Last 7 din</p>
        <div className="mt-3 flex h-32 items-end gap-2">
          {days.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-bold">{d.amt ? inr(d.amt) : ""}</span>
              <div className="w-full rounded-t-md bg-primary" style={{ height: `${(d.amt / max) * 90 + 2}px` }} />
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Bike; label: string; value: string }) {
  return (
    <div className="animate-card-in rounded-2xl border bg-card p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-lg font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({ title, count, icon: Icon, children }: { title: string; count: number; icon?: typeof Bike; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <h2 className="text-sm font-extrabold">{title}</h2>
        <span className="rounded-lg bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">{count}</span>
      </div>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function OrderCard({
  order,
  delay,
  action,
  done,
  navigate,
  extra,
}: {
  order: Order;
  delay: number;
  action?: { label: string; onClick: () => void; className: string };
  done?: boolean;
  navigate?: boolean;
  extra?: React.ReactNode;
}) {
  const q = encodeURIComponent(order.customer.address);
  return (
    <div className="animate-card-in rounded-2xl border bg-card p-4" style={{ animationDelay: `${Math.min(delay, 8) * 50}ms` }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-extrabold">#{order.id}</span>
        <span className={`rounded-lg px-2 py-1 text-xs font-bold text-accent-foreground ${done ? "bg-muted" : "bg-accent"}`}>
          {done ? "Delivered" : STATUS_LABEL[order.status]}
        </span>
        {!done && <span className="text-xs font-bold text-primary">+{inr(PER_DELIVERY)}</span>}
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
        <div className="flex flex-col gap-1">
          <a href={`tel:${order.customer.phone}`} className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground">
            <Phone className="h-3.5 w-3.5" /> Call
          </a>
          {navigate && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${q}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-bold text-secondary-foreground"
            >
              <Navigation className="h-3.5 w-3.5" /> Map
            </a>
          )}
        </div>
      </div>
      {order.payment === "cod" && !done && (
        <p className="mt-2 inline-block rounded-lg bg-accent px-2 py-1.5 text-xs font-semibold text-accent-foreground">
          COD: {inr(order.total)} customer se lena hai
        </p>
      )}
      {action && (
        <button onClick={action.onClick} className={`mt-3 w-full rounded-xl py-2.5 text-sm font-extrabold transition-transform active:scale-95 ${action.className}`}>
          {action.label}
        </button>
      )}
      {extra}
    </div>
  );
}
