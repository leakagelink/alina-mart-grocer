import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Bike,
  Camera,
  CheckCircle2,
  HandCoins,
  Info,
  IndianRupee,
  LogOut,
  MapPin,
  Navigation,
  PackageOpen,
  Phone,
  Power,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  STATUS_LABEL,
  assignRider,
  depositCash,
  hydrate,
  inr,
  requestPayout,
  returnOrder,
  setOrderProof,
  setOrderStatus,
  useStore,
  type CashDeposit,
  type Order,
  type Payout,
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
const REASONS = [
  "Customer ghar par nahi tha",
  "Address galat tha",
  "Customer ne order mana kar diya",
  "Order damaged tha",
];

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

function shrinkPhoto(file: File, done: (dataUrl: string) => void) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const scale = Math.min(1, 640 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * scale));
    c.height = Math.max(1, Math.round(img.height * scale));
    c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
    done(c.toDataURL("image/jpeg", 0.6));
    URL.revokeObjectURL(url);
  };
  img.src = url;
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
          <p className="mt-3 text-[11px] text-muted-foreground">Demo rider: 9876543210 / password ravi123</p>
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
  const [tab, setTab] = useState<"orders" | "cash" | "earnings">("orders");
  const [otpOrder, setOtpOrder] = useState<Order | null>(null);
  const [detail, setDetail] = useState<Order | null>(null);
  const [retOrder, setRetOrder] = useState<Order | null>(null);

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
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const month = delivered.filter((o) => o.createdAt >= monthStart.getTime());
  const codDue = active.filter((o) => o.payment === "cod").reduce((s, o) => s + o.total, 0);
  const codToday = today.filter((o) => o.payment === "cod").reduce((s, o) => s + o.total, 0);
  const codTotal = delivered.filter((o) => o.payment === "cod").reduce((s, o) => s + o.total, 0);
  const deposits = useMemo(() => state.cashDeposits.filter((d) => d.rider === rider.name), [state, rider.name]);
  const deposited = deposits.reduce((s, d) => s + d.amount, 0);
  const codPending = codTotal - deposited;
  const payouts = useMemo(() => state.payouts.filter((p) => p.rider === rider.name), [state, rider.name]);

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
          {(["orders", "cash", "earnings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-extrabold ${
                tab === t ? "bg-primary-foreground text-primary" : "opacity-80"
              }`}
            >
              {t === "orders" ? "Orders" : t === "cash" ? "Cash" : "Earnings"}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-12 pt-4">
        {tab === "cash" ? (
          <Cash
            riderName={rider.name}
            codToday={codToday}
            codTotal={codTotal}
            pending={codPending}
            deposits={deposits}
          />
        ) : tab === "earnings" ? (
          <Earnings
            riderName={rider.name}
            today={today}
            week={week}
            month={month}
            payouts={payouts}
          />
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
                    onOpen={() => setDetail(o)}
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
                    onOpen={() => setDetail(o)}
                    action={{
                      label: o.payment === "cod" ? `Deliver • ${inr(o.total)} cash lena hai` : "Deliver (OTP)",
                      onClick: () => setOtpOrder(o),
                      className: o.payment === "cod" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground",
                    }}
                    extra={
                      <button
                        onClick={() => setRetOrder(o)}
                        className="mt-2 w-full text-xs font-bold text-muted-foreground underline"
                      >
                        Customer nahi mila? Return karein
                      </button>
                    }
                  />
                ))
              )}
            </Section>

            {today.length > 0 && (
              <Section title="Aaj delivered" count={today.length}>
                {today.map((o, i) => (
                  <OrderCard key={o.id} order={o} delay={i} done onOpen={() => setDetail(o)} />
                ))}
              </Section>
            )}
          </>
        )}
      </main>

      {otpOrder && <OtpDialog order={otpOrder} onClose={() => setOtpOrder(null)} />}
      {detail && <OrderDetail order={detail} onClose={() => setDetail(null)} />}
      {retOrder && <ReturnDialog order={retOrder} onClose={() => setRetOrder(null)} />}
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
  const [photo, setPhoto] = useState<string | null>(null);
  const confirm = () => {
    if (otp !== otpFor(order)) { toast.error("OTP galat hai"); return; }
    if (!cash) { toast.error("Pehle cash collect confirm karein"); return; }
    if (photo) setOrderProof(order.id, photo);
    setOrderStatus(order.id, "delivered");
    beep();
    toast.success(`#${order.id} delivered • +${inr(PER_DELIVERY)} kamaye`);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 sm:items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="animate-fade-up max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-card p-5 sm:rounded-3xl">
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
        <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed p-3 text-sm font-bold">
          <Camera className="h-4 w-4 text-primary" />
          {photo ? "Photo attach ho gayi ✓ (badalni ho to dobara choose karein)" : "Delivery photo lein (optional)"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) shrinkPhoto(f, setPhoto);
            }}
          />
        </label>
        {photo && <img src={photo} alt="Delivery proof" className="mt-2 h-24 w-24 rounded-xl object-cover" />}
        <button onClick={confirm} className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground active:scale-95">
          Delivered
        </button>
      </div>
    </div>
  );
}

function ReturnDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const submit = () => {
    const text = note.trim() ? `${reason} — ${note.trim()}` : reason;
    returnOrder(order.id, text);
    toast("Order store wapas gaya — admin ko dikhega");
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 sm:items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="animate-fade-up w-full max-w-sm rounded-t-3xl bg-card p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold">Return karne ki wajah</h3>
          <button onClick={onClose} aria-label="Band karein" className="rounded-full bg-muted p-1.5">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {REASONS.map((r) => (
            <label key={r} className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold">
              <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />
              {r}
            </label>
          ))}
        </div>
        <input
          value={note}
          maxLength={150}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Extra detail (optional)"
          className="mt-3 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button onClick={submit} className="mt-4 w-full rounded-xl bg-secondary py-3 text-sm font-extrabold text-secondary-foreground active:scale-95">
          Order return karein
        </button>
      </div>
    </div>
  );
}

function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 sm:items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="animate-fade-up max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold">Order #{order.id}</h3>
          <button onClick={onClose} aria-label="Band karein" className="rounded-full bg-muted p-1.5">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {order.items.map((i) => (
            <div key={i.productId} className="flex items-center justify-between text-sm">
              <span>{i.emoji} {i.name} × {i.qty}</span>
              <span className="font-semibold">{inr(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-2 text-sm font-extrabold">
            <span>Total</span>
            <span>{inr(order.total)}</span>
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
          <p className="font-bold text-foreground">{order.customer.name} • {order.customer.phone}</p>
          <p>{order.customer.address}</p>
          <p className="mt-1 font-bold text-foreground">
            {order.payment === "cod" ? "COD — cash lena hai" : "Online paid"}
          </p>
        </div>
        {order.note && (
          <p className="mt-2 rounded-xl bg-accent p-3 text-xs font-semibold text-accent-foreground">Note: {order.note}</p>
        )}
        {order.returnReason && (
          <p className="mt-2 rounded-xl bg-accent p-3 text-xs font-semibold text-accent-foreground">
            Return wajah: {order.returnReason}
          </p>
        )}
        {order.photo && <img src={order.photo} alt="Delivery proof" className="mt-2 w-full rounded-xl" />}
      </div>
    </div>
  );
}

function Cash({
  riderName,
  codToday,
  codTotal,
  pending,
  deposits,
}: {
  riderName: string;
  codToday: number;
  codTotal: number;
  pending: number;
  deposits: CashDeposit[];
}) {
  const [amt, setAmt] = useState("");
  const submit = () => {
    const n = Math.round(Number(amt));
    if (!n || n <= 0) { toast.error("Jama karne ki amount daalein"); return; }
    if (n > pending) { toast.error("Pending cash se zyada jama nahi ho sakta"); return; }
    depositCash(riderName, n);
    setAmt("");
    toast.success(`${inr(n)} store me jama ho gaya`);
  };
  return (
    <div className="space-y-4">
      <div className="animate-card-in rounded-3xl bg-primary p-5 text-primary-foreground">
        <p className="text-xs opacity-80">Store me jama karna hai (COD)</p>
        <p className="text-3xl font-extrabold">{inr(Math.max(0, pending))}</p>
        <p className="text-xs opacity-80">Aaj collect: {inr(codToday)} • Total collect: {inr(codTotal)}</p>
      </div>
      <div className="animate-card-in rounded-2xl border bg-card p-4">
        <p className="text-sm font-extrabold">Cash store me jama karein</p>
        <div className="mt-2 flex gap-2">
          <input
            value={amt}
            onChange={(e) => setAmt(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="Amount (₹)"
            className="flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => setAmt(String(Math.max(0, pending)))}
            className="rounded-xl bg-accent px-3 py-2 text-xs font-bold text-accent-foreground"
          >
            Poora
          </button>
        </div>
        <button onClick={submit} className="mt-3 w-full rounded-xl bg-secondary py-2.5 text-sm font-extrabold text-secondary-foreground active:scale-95">
          Jama karein
        </button>
      </div>
      <Section title="Jama history" count={deposits.length} icon={HandCoins}>
        {deposits.length === 0 ? (
          <Empty text="Abhi tak cash jama nahi kiya." />
        ) : (
          deposits.map((d) => (
            <div key={d.id} className="animate-card-in flex items-center justify-between rounded-2xl border bg-card p-3 text-sm">
              <div>
                <p className="font-extrabold">{inr(d.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(d.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
          ))
        )}
      </Section>
    </div>
  );
}

function Earnings({
  riderName,
  today,
  week,
  month,
  payouts,
}: {
  riderName: string;
  today: Order[];
  week: Order[];
  month: Order[];
  payouts: Payout[];
}) {
  const weekEarn = week.length * PER_DELIVERY;
  const [amt, setAmt] = useState(String(weekEarn));
  const req = () => {
    const n = Math.round(Number(amt));
    if (!n || n < 100) { toast.error("Kam se kam ₹100 ki payout request karein"); return; }
    requestPayout(riderName, n);
    toast.success("Payout request admin ko bhej di gayi");
  };
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
        <Stat icon={IndianRupee} label="Is hafte" value={inr(weekEarn)} />
        <Stat icon={Wallet} label="Is mahine" value={inr(month.length * PER_DELIVERY)} />
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
      <div className="animate-card-in rounded-2xl border bg-card p-4">
        <p className="text-sm font-extrabold">Payout request</p>
        <p className="text-xs text-muted-foreground">Kamai bank me bhejne ke liye admin ko request bhejein.</p>
        <div className="mt-2 flex gap-2">
          <input
            value={amt}
            onChange={(e) => setAmt(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="Amount (₹)"
            className="flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button onClick={req} className="rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground">
            Request
          </button>
        </div>
      </div>
      <Section title="Payout history" count={payouts.length} icon={IndianRupee}>
        {payouts.length === 0 ? (
          <Empty text="Abhi koi payout request nahi ki." />
        ) : (
          payouts.map((p) => (
            <div key={p.id} className="animate-card-in flex items-center justify-between rounded-2xl border bg-card p-3 text-sm">
              <div>
                <p className="font-extrabold">{inr(p.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(p.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <span className={`rounded-lg px-2 py-1 text-xs font-bold ${p.status === "paid" ? "bg-muted" : "bg-accent text-accent-foreground"}`}>
                {p.status === "paid" ? "Paid" : "Pending"}
              </span>
            </div>
          ))
        )}
      </Section>
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
  onOpen,
  extra,
}: {
  order: Order;
  delay: number;
  action?: { label: string; onClick: () => void; className: string };
  done?: boolean;
  navigate?: boolean;
  onOpen?: () => void;
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
        <div className="ml-auto flex items-center gap-2">
          {onOpen && (
            <button onClick={onOpen} className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs font-bold">
              <Info className="h-3.5 w-3.5" /> Detail
            </button>
          )}
          <span className="text-sm font-extrabold">{inr(order.total)}</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {order.items.map((i) => `${i.emoji} ${i.name} ×${i.qty}`).join(", ")}
      </p>
      {order.photo && done && (
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-primary">
          <Camera className="h-3.5 w-3.5" /> Photo proof attached
        </p>
      )}
      {order.returnReason && !done && (
        <p className="mt-1 text-xs font-semibold text-muted-foreground">Return wajah: {order.returnReason}</p>
      )}
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
