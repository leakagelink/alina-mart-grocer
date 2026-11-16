import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bike,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Package,
  Pencil,
  ShoppingBag,
  Store,
  TicketPercent,
  Trash2,
  TriangleAlert,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { ProductImage } from "@/components/ProductImage";
import { BackButton } from "@/components/BackButton";
import {
  CATEGORIES,
  deleteProduct,
  hydrate,
  inr,
  ownProducts,
  upsertProduct,
  useStore,
} from "@/lib/store";
import { currentAccount, hydrateAccounts, logOut, useAccounts } from "@/lib/accounts";
import {
  hydrateVendor,
  requestVendorPayout,
  useVendorStore,
  vendorAvailable,
  vendorEarnings,
  vendorPayoutTotals,
} from "@/lib/vendor";

export const Route = createFileRoute("/vendor")({
  head: () => ({
    meta: [
      { title: "Vendor Panel — Martigo" },
      {
        name: "description",
        content: "Add your own products, watch your orders and track your payouts on Martigo.",
      },
      { property: "og:title", content: "Vendor Panel — Martigo" },
      { property: "og:description", content: "Apne products bechiye, orders aur kamai dekhiye." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VendorPanel,
});

type Tab = "home" | "products" | "orders" | "earnings";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "earnings", label: "Earnings", icon: Wallet },
];

const ORDER_STATUSES = ["all", "placed", "packed", "out_for_delivery", "delivered", "cancelled"];
const STATUS_LABEL: Record<string, string> = {
  all: "All",
  placed: "Placed",
  packed: "Packed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function VendorPanel() {
  const store = useStore();
  const accState = useAccounts();
  const vs = useVendorStore();
  const me = currentAccount(accState);
  const [tab, setTab] = useState<Tab>("home");
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    hydrate();
    hydrateAccounts();
    hydrateVendor();
  }, []);

  if (!accState.ready) return null;

  if (!me || me.role !== "vendor") {
    return (
      <div className="flex min-h-screen items-center justify-center brand-gradient p-4">
        <BackButton floating />
        <div className="animate-fade-up w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl">
          <Store className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-2 text-xl font-extrabold">Vendor panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sirf vendor account se khulta hai. Naya vendor account banaiye ya login kariye.
          </p>
          <Link
            to="/signup"
            className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
          >
            Sign up / Login
          </Link>
        </div>
      </div>
    );
  }

  if (me.vendorStatus !== "approved") {
    const st = me.vendorStatus ?? "not_submitted";
    return (
      <div className="flex min-h-screen items-center justify-center brand-gradient p-4">
        <BackButton floating />
        <div className="animate-fade-up w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl">
          <TriangleAlert className="mx-auto h-10 w-10 text-secondary" />
          <h1 className="mt-2 text-xl font-extrabold">
            {st === "submitted" ? "Application review mein hai" : "Pehle application complete kariye"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {st === "submitted"
              ? "Admin aapki dukaan check kar raha hai. Approve hote hi products add kar sakenge."
              : "Dukaan ki details aur documents submit kariye — approve hone ke baad bechna shuru ho jayega."}
          </p>
          {st === "rejected" && me.vendor?.rejectReason && (
            <p className="mt-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
              {me.vendor.rejectReason}
            </p>
          )}
          <Link
            to="/vendor-kyc"
            className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
          >
            {st === "submitted" ? "Status dekhiye" : "Application bharaiye"}
          </Link>
          <button
            onClick={() => {
              logOut();
              toast.success("Logout ho gaya");
            }}
            className="mt-3 block w-full text-xs underline"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const mine = ownProducts(store.products, me.id);
  const rows = vs.rows.filter((r) => r.vendorId === me.id);
  const payouts = vs.payouts.filter((p) => p.vendorId === me.id);
  const earned = vendorEarnings(rows);
  const available = vendorAvailable(rows, payouts);
  const { pending, paid } = vendorPayoutTotals(payouts);
  const live = rows.filter((r) => r.status !== "delivered" && r.status !== "cancelled").length;
  const low = mine.filter((p) => p.stock <= 10);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-3 pb-28 pt-4 sm:px-4 sm:pb-24">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{me.vendor?.shopName || "Vendor panel"}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {me.vendor?.ownerName || me.name} • {me.phone}
            </p>
          </div>
          <button
            onClick={() => {
              logOut();
              toast.success("Logout ho gaya");
            }}
            className="shrink-0 rounded-xl bg-muted px-3 py-2 text-xs font-bold text-muted-foreground"
          >
            Logout
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <Stat icon={Wallet} label="Available payout" value={inr(available)} />
          <Stat icon={IndianRupee} label="Total earned" value={inr(earned)} />
          <Stat icon={ShoppingBag} label="Live orders" value={String(live)} />
          <Stat icon={Package} label="My products" value={String(mine.length)} />
        </div>

        <div className="hide-scrollbar -mx-3 mt-4 hidden gap-2 overflow-x-auto px-3 py-1 sm:mx-0 sm:flex sm:px-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm ${
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "home" && (
          <div className="mt-4 space-y-4">
            {low.length > 0 && (
              <div className="animate-card-in rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
                <p className="flex items-center gap-2 text-sm font-extrabold">
                  <TriangleAlert className="h-4 w-4 text-destructive" /> Kam stock ({low.length})
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {low.map((p) => `${p.name} (${p.stock})`).join(", ")}
                </p>
              </div>
            )}
            <section>
              <p className="text-sm font-extrabold">Pichle orders</p>
              <div className="mt-2 space-y-2">
                {rows.slice(0, 5).map((r) => (
                  <OrderCard key={r.orderId} r={r} />
                ))}
                {rows.length === 0 && (
                  <p className="rounded-2xl bg-card p-4 text-center text-xs text-muted-foreground shadow-sm">
                    Abhi koi order nahi aaya. Products add kariye — customers ko turant dikhenge.
                  </p>
                )}
              </div>
            </section>
            <section className="rounded-2xl bg-card p-4 shadow-sm">
              <p className="text-sm font-extrabold">Paisa hisaab</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-muted p-2">
                  <p className="text-sm font-extrabold">{inr(pending)}</p>
                  <p className="text-muted-foreground">Pending payout</p>
                </div>
                <div className="rounded-xl bg-muted p-2">
                  <p className="text-sm font-extrabold">{inr(paid)}</p>
                  <p className="text-muted-foreground">Paid out</p>
                </div>
                <div className="rounded-xl bg-muted p-2">
                  <p className="text-sm font-extrabold">{inr(available)}</p>
                  <p className="text-muted-foreground">Available</p>
                </div>
              </div>
              <button
                onClick={() => setTab("earnings")}
                className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-extrabold text-primary-foreground active:scale-95"
              >
                Payout request kariye
              </button>
            </section>
          </div>
        )}

        {tab === "products" && <ProductsTab vendorId={me.id} />}

        {tab === "orders" && <OrdersTab rows={rows} />}

        {tab === "earnings" && (
          <EarningsTab vendorId={me.id} available={available} earned={earned} pending={pending} paid={paid} payouts={payouts} />
        )}
      </main>

      {/* mobile bottom nav */}
      {moreOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-foreground/40 sm:hidden" onClick={() => setMoreOpen(false)} />
          <div className="animate-fade-up fixed inset-x-0 bottom-16 z-50 mx-3 rounded-2xl border bg-card p-2 shadow-2xl sm:hidden">
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-xs font-bold text-muted-foreground">Aur options</p>
              <button onClick={() => setMoreOpen(false)} className="rounded-lg p-1 text-muted-foreground" aria-label="Close menu">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Link
              to="/vendor-kyc"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold"
            >
              <TicketPercent className="h-4 w-4" /> Application details
            </Link>
            <button
              onClick={() => {
                logOut();
                toast.success("Logout ho gaya");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="grid grid-cols-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold ${
                tab === t.id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <t.icon className="h-5 w-5" />
              {t.label}
            </button>
          ))}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold text-muted-foreground"
          >
            <Bike className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof LayoutDashboard; label: string; value: string }) {
  return (
    <div className="animate-card-in rounded-2xl border bg-card p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-lg font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ---------------- Products ----------------

const EMPTY = { name: "", category: "fruits", price: "", mrp: "", unit: "", emoji: "🛍️", image: "", stock: "" };

function ProductsTab({ vendorId }: { vendorId: string }) {
  const store = useStore();
  const mine = ownProducts(store.products, vendorId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  const save = () => {
    const price = Number(form.price);
    const mrp = Number(form.mrp || form.price);
    const stock = Number(form.stock);
    if (!form.name.trim() || !price || !form.unit.trim()) {
      toast.error("Name, price aur unit zaroori hai");
      return;
    }
    upsertProduct({
      id: editingId ?? "vp" + Date.now().toString().slice(-7),
      name: form.name.trim().slice(0, 60),
      category: form.category,
      price,
      mrp: Math.max(mrp, price),
      unit: form.unit.trim().slice(0, 20),
      emoji: form.emoji.trim() || "🛍️",
      image: form.image.trim() || null,
      stock: Number.isFinite(stock) ? stock : 0,
      vendorId,
    });
    toast.success(editingId ? "Product update ho gaya" : "Product add ho gaya");
    setEditingId(null);
    setForm(EMPTY);
  };

  const inp = "rounded-xl border bg-background px-3 py-2 text-sm";

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-2xl border bg-card p-4">
        <p className="text-sm font-bold">{editingId ? "Product edit kariye" : "Naya product add kariye"}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <input
            className={inp}
            placeholder="Product name"
            style={{ gridColumn: "1 / -1" }}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select className={inp} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input className={inp} placeholder="Emoji" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
          <input
            className={inp}
            placeholder="Photo URL (optional)"
            style={{ gridColumn: "1 / -1" }}
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
          />
          <input
            className={inp}
            placeholder="Price ₹"
            inputMode="numeric"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, "") })}
          />
          <input
            className={inp}
            placeholder="MRP ₹"
            inputMode="numeric"
            value={form.mrp}
            onChange={(e) => setForm({ ...form, mrp: e.target.value.replace(/\D/g, "") })}
          />
          <input className={inp} placeholder="Unit (500 g)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <input
            className={inp}
            placeholder="Stock qty"
            inputMode="numeric"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value.replace(/\D/g, "") })}
          />
        </div>
        <button onClick={save} className="mt-3 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground">
          {editingId ? "Save changes" : "Add product"}
        </button>
        {editingId && (
          <button
            onClick={() => {
              setEditingId(null);
              setForm(EMPTY);
            }}
            className="ml-2 mt-3 rounded-xl bg-muted px-4 py-2 text-sm font-bold text-muted-foreground"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[440px] text-sm">
          <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {mine.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  <span className="mr-2 inline-grid h-8 w-8 place-items-center overflow-hidden rounded-lg bg-surface align-middle text-lg">
                    <ProductImage product={p} />
                  </span>
                  {p.name}
                  <span className="ml-1 text-xs text-muted-foreground">({p.unit})</span>
                </td>
                <td className="p-3">
                  <input
                    className="w-20 rounded-lg border bg-background px-2 py-1"
                    value={p.price}
                    inputMode="numeric"
                    onChange={(e) =>
                      upsertProduct({ ...p, price: Number(e.target.value.replace(/\D/g, "")) || 0, vendorId })
                    }
                  />
                </td>
                <td className="p-3">
                  <input
                    className={`w-20 rounded-lg border bg-background px-2 py-1 ${p.stock <= 10 ? "border-destructive text-destructive" : ""}`}
                    value={p.stock}
                    inputMode="numeric"
                    onChange={(e) =>
                      upsertProduct({ ...p, stock: Number(e.target.value.replace(/\D/g, "")) || 0, vendorId })
                    }
                  />
                </td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setEditingId(p.id);
                        setForm({
                          name: p.name,
                          category: p.category,
                          price: String(p.price),
                          mrp: String(p.mrp),
                          unit: p.unit,
                          emoji: p.emoji,
                          image: p.image ?? "",
                          stock: String(p.stock),
                        });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-muted-foreground hover:text-primary"
                      aria-label="Edit product"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (!window.confirm(`${p.name} delete karein?`)) return;
                        deleteProduct(p.id, vendorId);
                        toast.success("Product hata diya gaya");
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Delete product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {mine.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-xs text-muted-foreground">
                  Abhi tak koi product nahi. Upar form bharke add kariye.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- Orders ----------------

function OrdersTab({ rows }: { rows: ReturnType<typeof useVendorStore>["rows"] }) {
  const [f, setF] = useState("all");
  const list = rows.filter((r) => f === "all" || r.status === f);
  return (
    <div className="mt-4">
      <div className="hide-scrollbar flex gap-2 overflow-x-auto">
        {ORDER_STATUSES.map((k) => (
          <button
            key={k}
            onClick={() => setF(k)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
              f === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {STATUS_LABEL[k]} ({k === "all" ? rows.length : rows.filter((r) => r.status === k).length})
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {list.map((r) => (
          <OrderCard key={r.orderId} r={r} showCustomer />
        ))}
        {list.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Is status ka koi order nahi.</p>
        )}
      </div>
    </div>
  );
}

function OrderCard({ r, showCustomer }: { r: ReturnType<typeof useVendorStore>["rows"][number]; showCustomer?: boolean }) {
  return (
    <div className="animate-card-in rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold">#{r.orderId}</span>
        <span className="rounded-lg bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
          {STATUS_LABEL[r.status] ?? r.status}
        </span>
        <span className="ml-auto text-sm font-bold">{inr(r.amount)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {r.items.map((i) => `${i.emoji || "🛍️"} ${i.name} ×${i.qty}`).join(", ")}
      </p>
      {showCustomer && r.customer?.address && (
        <p className="mt-1 break-words text-xs text-muted-foreground">
          {r.customer.name} • {r.customer.phone} • {r.customer.address}
        </p>
      )}
      {r.note && <p className="mt-1 text-xs italic text-muted-foreground">Note: {r.note}</p>}
    </div>
  );
}

// ---------------- Earnings ----------------

function EarningsTab({
  vendorId,
  available,
  earned,
  pending,
  paid,
  payouts,
}: {
  vendorId: string;
  available: number;
  earned: number;
  pending: number;
  paid: number;
  payouts: ReturnType<typeof useVendorStore>["payouts"];
}) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const request = async () => {
    const a = Number(amount);
    if (!a) return toast.error("Amount daaliye");
    if (a > available) return toast.error(`Abhi sirf ${inr(available)} available hai`);
    setBusy(true);
    try {
      await requestVendorPayout(vendorId, a);
      setAmount("");
      toast.success("Payout request bhej di — admin jaldi pay kar dega");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon={Wallet} label="Available" value={inr(available)} />
        <Stat icon={IndianRupee} label="Earned (delivered)" value={inr(earned)} />
        <Stat icon={ShoppingBag} label="Pending payout" value={inr(pending)} />
        <Stat icon={TicketPercent} label="Paid out" value={inr(paid)} />
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <p className="text-sm font-bold">Payout request kariye</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Sirf delivered orders ki kamai nikal sakti hai. Admin bank account mein bhej dega.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm"
            placeholder={`Amount (max ${inr(available)})`}
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          />
          <button
            onClick={request}
            disabled={busy}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground active:scale-95 disabled:opacity-60"
          >
            {busy ? "Bhej rahe hain…" : "Request"}
          </button>
        </div>
        <button
          onClick={() => setAmount(String(Math.floor(available)))}
          className="mt-2 text-xs font-bold text-primary underline"
        >
          Sab ({inr(available)}) daaliye
        </button>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <p className="text-sm font-bold">Payout history</p>
        <div className="mt-2 space-y-2">
          {payouts.length === 0 && <p className="text-xs text-muted-foreground">Abhi koi payout request nahi.</p>}
          {payouts.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs">
              <span className="font-bold">{inr(p.amount)}</span>
              <span className="text-muted-foreground">{new Date(p.at).toLocaleDateString("en-IN")}</span>
              <span
                className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  p.status === "paid" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {p.status === "paid" ? "Paid" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
