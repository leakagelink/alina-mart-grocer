import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, Zap } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, cartCount, cartSubtotal, hydrate, inr, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alina Mart — Groceries & Daily Essentials in 15 Minutes" },
      {
        name: "description",
        content:
          "Order fruits, vegetables, dairy, snacks and household essentials from Alina Mart with 15-minute delivery, COD or online payment, and live order tracking.",
      },
      { property: "og:title", content: "Alina Mart — Groceries in 15 Minutes" },
      {
        property: "og:description",
        content: "Fresh groceries and daily essentials delivered fast. COD & online payment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const state = useStore();

  useEffect(() => {
    hydrate();
  }, []);

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.products.filter(
      (p) => (!cat || p.category === cat) && (!q || p.name.toLowerCase().includes(q)),
    );
  }, [state.products, query, cat]);

  const count = cartCount(state);
  const subtotal = cartSubtotal(state);

  return (
    <div className="flex min-h-screen flex-col">
      <Header query={query} onQuery={setQuery} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-4">
        <section className="flex items-center gap-4 rounded-2xl bg-accent p-4">
          <div>
            <p className="flex items-center gap-1 text-sm font-bold text-accent-foreground">
              <Zap className="h-4 w-4" /> Superfast delivery
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Groceries • Daily Essentials • More — at your door in 15 minutes
            </p>
          </div>
          <span className="ml-auto flex items-center gap-1 rounded-xl bg-card px-3 py-2 text-sm font-bold text-primary">
            <Clock className="h-4 w-4" /> 15 min
          </span>
        </section>

        <h2 className="mb-2 mt-6 text-base font-bold">Shop by category</h2>
        <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-1">
          <button
            onClick={() => setCat(null)}
            className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-semibold ${
              cat === null ? "border-primary bg-primary text-primary-foreground" : "bg-card"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(cat === c.id ? null : c.id)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-semibold ${
                cat === c.id ? "border-primary bg-primary text-primary-foreground" : "bg-card"
              }`}
            >
              <span className="mr-1">{c.emoji}</span>
              {c.name}
            </button>
          ))}
        </div>

        <h2 className="mb-3 mt-6 text-base font-bold">
          {cat ? CATEGORIES.find((c) => c.id === cat)?.name : "All products"}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {products.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Koi product nahi mila. Doosra naam try karein.
          </p>
        )}
      </main>

      {count > 0 && (
        <Link
          to="/cart"
          className="fixed bottom-20 left-1/2 z-40 w-[92%] max-w-md -translate-x-1/2 rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-lg"
        >
          <div className="flex items-center justify-between text-sm font-bold">
            <span>
              {count} item{count > 1 ? "s" : ""} • {inr(subtotal)}
            </span>
            <span>View cart →</span>
          </div>
        </Link>
      )}

      <BottomNav />
    </div>
  );
}
