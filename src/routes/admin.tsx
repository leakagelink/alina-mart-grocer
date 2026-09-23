import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { IndianRupee, PackageCheck, ShoppingBag, TriangleAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
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

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Alina Mart" },
      {
        name: "description",
        content: "Manage Alina Mart products, stock levels, orders and delivery status.",
      },
      { property: "og:title", content: "Admin Panel — Alina Mart" },
      { property: "og:description", content: "Products, stock and order management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

const STATUSES: OrderStatus[] = ["placed", "packed", "out_for_delivery", "delivered", "cancelled"];

function Admin() {
  const state = useStore();
  const [tab, setTab] = useState<"orders" | "products">("orders");
  const [form, setForm] = useState({
    name: "",
    category: "fruits",
    price: "",
    mrp: "",
    unit: "",
    emoji: "🛍️",
    stock: "",
  });

  useEffect(() => {
    hydrate();
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
      id: "p" + Date.now().toString().slice(-7),
      name: form.name.trim().slice(0, 60),
      category: form.category,
      price,
      mrp: Math.max(mrp, price),
      unit: form.unit.trim().slice(0, 20),
      emoji: form.emoji.trim() || "🛍️",
      stock: Number.isFinite(stock) ? stock : 0,
    });
    toast.success("Product added");
    setForm({ ...form, name: "", price: "", mrp: "", unit: "", stock: "" });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-10 pt-4">
        <h1 className="text-lg font-bold">Admin panel</h1>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={ShoppingBag} label="Orders" value={String(stats.orders)} />
          <Stat icon={IndianRupee} label="Revenue" value={inr(stats.revenue)} />
          <Stat icon={PackageCheck} label="Pending" value={String(stats.pending)} />
          <Stat icon={TriangleAlert} label="Low stock" value={String(stats.low)} />
        </div>

        <div className="mt-5 flex gap-2">
          {(["orders", "products"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl px-4 py-2 text-sm font-bold capitalize ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "orders" ? (
          <div className="mt-4 space-y-3">
            {state.orders.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Abhi koi order nahi aaya.
              </p>
            )}
            {state.orders.map((o) => (
              <div key={o.id} className="rounded-2xl border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">#{o.id}</span>
                  <span className="rounded-lg bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
                    {o.payment === "cod" ? "COD" : o.paid ? "Paid online" : "Online"}
                  </span>
                  <span className="ml-auto text-sm font-bold">{inr(o.total)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
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
              <p className="text-sm font-bold">Add new product</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <input
                  className="rounded-xl border bg-background px-3 py-2 text-sm"
                  placeholder="Product name"
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
                Add product
              </button>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border bg-card">
              <table className="w-full text-sm">
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
                        <span className="mr-2">{p.emoji}</span>
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
                      <td className="p-3">
                        <button
                          onClick={() => {
                            deleteProduct(p.id);
                            toast.success("Product removed");
                          }}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
      <BottomNav />
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
    <div className="rounded-2xl border bg-card p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-lg font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
