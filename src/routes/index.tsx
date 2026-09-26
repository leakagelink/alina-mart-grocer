import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, Zap } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { useLang } from "@/lib/i18n";
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
  const { t, tc } = useLang();

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
        <section className="animate-fade-up flex items-center gap-4 rounded-2xl bg-accent p-4">
          <div>
            <p className="flex items-center gap-1 text-sm font-bold text-accent-foreground">
              <Zap className="h-4 w-4" /> {t("superfast")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("heroSub")}
            </p>
          </div>
          <span className="ml-auto flex items-center gap-1 rounded-xl bg-card px-3 py-2 text-sm font-bold text-primary">
            <Clock className="h-4 w-4" /> {t("min15")}
          </span>
        </section>

        {state.settings.announcement && (
          <div className="animate-pop mt-3 rounded-2xl border border-primary/30 bg-card p-3 text-center text-sm font-semibold text-primary">
            📣 {state.settings.announcement}
          </div>
        )}

        <h2 className="mb-2 mt-6 text-base font-bold">{t("shopByCat")}</h2>
        <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-1">
          <button
            onClick={() => setCat(null)}
            className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-semibold ${
              cat === null ? "border-primary bg-primary text-primary-foreground" : "bg-card"
            }`}
          >
            {t("all")}
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
              {tc(c.id, c.name)}
            </button>
          ))}
        </div>

        <h2 className="mb-3 mt-6 text-base font-bold">
          {cat ? tc(cat, CATEGORIES.find((c) => c.id === cat)?.name ?? "") : t("allProducts")}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
        {products.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t("noProducts")}
          </p>
        )}
      </main>

      {count > 0 && (
        <Link
          to="/cart"
          className="animate-pop fixed bottom-20 left-1/2 z-40 w-[92%] max-w-md -translate-x-1/2 rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-lg"
        >
          <div className="flex items-center justify-between text-sm font-bold">
            <span>
              {count} {t("items")} • {inr(subtotal)}
            </span>
            <span>{t("viewCart")}</span>
          </div>
        </Link>
      )}

      <BottomNav />
    </div>
  );
}
