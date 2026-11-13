import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { IndianRupee, PackageCheck, Pencil, ShoppingBag, TriangleAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { RidersKyc } from "@/components/RidersKyc";
import { UsersAdmin } from "@/components/UsersAdmin";
import { ShippingPartners } from "@/components/ShippingPartners";
import { DashboardReports } from "@/components/DashboardReports";
import { CouponsAdmin } from "@/components/CouponsAdmin";
import { AppSettingsAdmin } from "@/components/AppSettingsAdmin";
import { NotificationsAdmin } from "@/components/NotificationsAdmin";
import { BottomNav } from "@/components/BottomNav";
import { AdminNav } from "@/components/AdminNav";
import { ProductImage } from "@/components/ProductImage";
import { BackButton } from "@/components/BackButton";
import {
  CATEGORIES,
  STATUS_LABEL,
  deleteProduct,
  hydrate,
  inr,
  setOrderStatus,
  upsertProduct,
  useStore,
  type OrderStatus,
} from "@/lib/store";
import { currentAccount, hydrateAccounts, logIn, logOut, useAccounts } from "@/lib/accounts";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Martigo" },
      {
        name: "description",
        content: "Manage Martigo products, stock levels, orders and delivery status.",
      },
      { property: "og:title", content: "Admin Panel — Martigo" },
      { property: "og:description", content: "Products, stock and order management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

const STATUSES: OrderStatus[] = ["placed", "packed", "out_for_delivery", "delivered", "cancelled"];

const TABS = [
  "dashboard",
  "orders",
  "products",
  "coupons",
  "notifications",
  "settings",
  "riders",
  "users",
  "shipping",
] as const;
type AdminTab = (typeof TABS)[number];
const TAB_LABELS: Record<AdminTab, string> = {
  dashboard: "Dashboard",
  orders: "Orders",
  products: "Products",
  coupons: "Coupons",
  notifications: "Notifications",
  settings: "App settings",
  riders: "Delivery KYC",
  users: "Users",
  shipping: "Shipping partners",
};

function Admin() {
  const state = useStore();
  const accState = useAccounts();
  const me = currentAccount(accState);
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "fruits",
    price: "",
    mrp: "",
    unit: "",
    emoji: "🛍️",
    image: "",
    stock: "",
  });

  useEffect(() => {
    hydrate();
    hydrateAccounts();
  }, []);

  const stats = useMemo(() => {
    const revenue = state.orders
      .filter((o) => o.status !== "cancelled")
      .reduce((s, o) => s + o.total, 0);
    const pending = state.orders.filter(
      (o) => o.status !== "delivered" && o.status !== "cancelled",
    ).length;
    const low = state.products.filter((p) => p.stock <= 10).length;
    return { revenue, pending, low, orders: state.orders.length };
  }, [state]);

  const addProduct = () => {
    const price = Number(form.price);
    const mrp = Number(form.mrp || form.price);
    const stock = Number(form.stock);
    if (!form.name.trim() || !price || !form.unit.trim()) {
      toast.error("Name, price aur unit zaroori hai");
      return;
    }
    upsertProduct({
      id: editingId ?? "p" + Date.now().toString().slice(-7),
      name: form.name.trim().slice(0, 60),
      category: form.category,
      price,
      mrp: Math.max(mrp, price),
      unit: form.unit.trim().slice(0, 20),
      emoji: form.emoji.trim() || "🛍️",
      image: form.image.trim() || null,
      stock: Number.isFinite(stock) ? stock : 0,
    });
    toast.success(editingId ? "Product updated" : "Product added");
    setEditingId(null);
    setForm({ ...form, name: "", price: "", mrp: "", unit: "", stock: "", image: "" });
  };

  if (!me || me.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center brand-gradient p-4">
        <BackButton floating />
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const a = await logIn(phone.trim(), password);
              if (a.role !== "admin") {
                await logOut();
                toast.error("Ye admin account nahi hai");
                return;
              }
              toast.success("Welcome Admin!");
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
          className="animate-fade-up w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl"
        >
          <h1 className="text-center text-xl font-extrabold">Admin Login</h1>
          <p className="mt-1 text-center text-xs text-muted-foreground">Sirf admin ke liye</p>
          <label className="mt-4 block text-xs font-bold">Mobile number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            maxLength={10}
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm"
            placeholder="10 digit number"
          />
          <label className="mt-3 block text-xs font-bold">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm"
          />
          <button className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground active:scale-95">
            Login
          </button>
          <Link to="/" className="mt-3 block text-center text-xs text-muted-foreground underline">
            Home par wapas
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-3 pb-28 pt-4 sm:px-4 sm:pb-24">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <h1 className="truncate text-lg font-bold">Admin panel</h1>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/delivery"
              className="rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-secondary-foreground"
            >
              <span className="sm:hidden">Rider view</span>
              <span className="hidden sm:inline">Delivery partner view</span>
            </Link>
            <button
              onClick={() => { logOut(); toast.success("Logout ho gaya"); }}
              className="rounded-xl bg-muted px-3 py-2 text-xs font-bold text-muted-foreground"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <Stat icon={ShoppingBag} label="Orders" value={String(stats.orders)} />
          <Stat icon={IndianRupee} label="Revenue" value={inr(stats.revenue)} />
          <Stat icon={PackageCheck} label="Pending" value={String(stats.pending)} />
          <Stat icon={TriangleAlert} label="Low stock" value={String(stats.low)} />
        </div>

        <div className="hide-scrollbar -mx-3 mt-4 hidden gap-2 overflow-x-auto px-3 py-1 sm:mx-0 sm:flex sm:px-0">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {tab === "users" ? (
          <UsersAdmin />
        ) : tab === "shipping" ? (
          <ShippingPartners />
        ) : tab === "riders" ? (
          <RidersKyc />
        ) : tab === "dashboard" ? (
          <DashboardReports />
        ) : tab === "coupons" ? (
          <CouponsAdmin />
        ) : tab === "notifications" ? (
          <NotificationsAdmin />
        ) : tab === "settings" ? (
          <AppSettingsAdmin />
        ) : tab === "orders" ? (
          <div className="mt-4 space-y-3">
            {state.orders.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Abhi koi order nahi aaya.
              </p>
            )}
            {state.orders.map((o, i) => (
              <div
                key={o.id}
                className="animate-card-in rounded-2xl border bg-card p-4"
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">#{o.id}</span>
                  <span className="rounded-lg bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
                    {o.payment === "cod" ? "COD" : o.paid ? "Paid online" : "Online"}
                  </span>
                  <span className="ml-auto text-sm font-bold">{inr(o.total)}</span>
                </div>
                <p className="mt-1 break-words text-xs text-muted-foreground">
                  {o.customer.name} • {o.customer.phone} • {o.customer.address}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {o.items.map((i) => `${i.emoji} ${i.name} ×${i.qty}`).join(", ")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setOrderStatus(o.id, s)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                        o.status === s
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background"
                      }`}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mt-4 rounded-2xl border bg-card p-4">
              <p className="text-sm font-bold">{editingId ? "Edit product" : "Add new product"}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <input
                  className="rounded-xl border bg-background px-3 py-2 text-sm"
                  placeholder="Product name"
                  style={{ gridColumn: "1 / -1" }}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <select
                  className="rounded-xl border bg-background px-3 py-2 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  className="rounded-xl border bg-background px-3 py-2 text-sm"
                  placeholder="Emoji"
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                />
                <input
                  className="rounded-xl border bg-background px-3 py-2 text-sm"
                  placeholder="Photo URL (optional)"
                  style={{ gridColumn: "1 / -1" }}
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
                <input
                  className="rounded-xl border bg-background px-3 py-2 text-sm"
                  placeholder="Price ₹"
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, "") })}
                />
                <input
                  className="rounded-xl border bg-background px-3 py-2 text-sm"
                  placeholder="MRP ₹"
                  inputMode="numeric"
                  value={form.mrp}
                  onChange={(e) => setForm({ ...form, mrp: e.target.value.replace(/\D/g, "") })}
                />
                <input
                  className="rounded-xl border bg-background px-3 py-2 text-sm"
                  placeholder="Unit (500 g)"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
                <input
                  className="rounded-xl border bg-background px-3 py-2 text-sm"
                  placeholder="Stock qty"
                  inputMode="numeric"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value.replace(/\D/g, "") })}
                />
              </div>
              <button
                onClick={addProduct}
                className="mt-3 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground"
              >
                {editingId ? "Save changes" : "Add product"}
              </button>
              {editingId && (
                <button
                  onClick={() => { setEditingId(null); setForm({ ...form, name: "", price: "", mrp: "", unit: "", stock: "", image: "" }); }}
                  className="ml-2 mt-3 rounded-xl bg-muted px-4 py-2 text-sm font-bold text-muted-foreground"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border bg-card">
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
                  {state.products.map((p) => (
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
                            upsertProduct({ ...p, price: Number(e.target.value.replace(/\D/g, "")) || 0 })
                          }
                        />
                      </td>
                      <td className="p-3">
                        <input
                          className={`w-20 rounded-lg border bg-background px-2 py-1 ${
                            p.stock <= 10 ? "border-destructive text-destructive" : ""
                          }`}
                          value={p.stock}
                          inputMode="numeric"
                          onChange={(e) =>
                            upsertProduct({ ...p, stock: Number(e.target.value.replace(/\D/g, "")) || 0 })
                          }
                        />
                      </td>
                      <td className="p-3"><div className="flex gap-3">
                        <button
                          onClick={() => {
                            setEditingId(p.id);
                            setForm({ name: p.name, category: p.category, price: String(p.price), mrp: String(p.mrp), unit: p.unit, emoji: p.emoji, image: p.image ?? "", stock: String(p.stock) });
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
                            deleteProduct(p.id);
                            toast.success("Product removed");
                          }}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
      <AdminNav tab={tab} onChange={setTab} />
      <div className="hidden sm:block">
        <BottomNav />
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShoppingBag;
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
