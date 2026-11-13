import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, ChevronRight, Leaf, Tag, Truck, Zap } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { useLang } from "@/lib/i18n";
import { CATEGORIES, cartCount, cartSubtotal, hydrate, inr, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Martigo — Groceries & Daily Essentials in 15 Minutes" },
      {
        name: "description",
        content:
          "Order fruits, vegetables, dairy, snacks and household essentials from Martigo with 15-minute delivery, COD or online payment, and live order tracking.",
      },
      { property: "og:title", content: "Martigo — Groceries in 15 Minutes" },
      {
        property: "og:description",
        content: "Fresh groceries and daily essentials delivered fast. COD & online payment.",
      },
      {
        property: "og:image",
        content: "https://alinamart.store/__l5e/assets-v1/a01d940e-f31d-4bfd-a3e8-a268bb870708/martigo-og.png",
      },
      {
        name: "twitter:image",
        content: "https://alinamart.store/__l5e/assets-v1/a01d940e-f31d-4bfd-a3e8-a268bb870708/martigo-og.png",
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
  const [banner, setBanner] = useState(0);
  const state = useStore();
  const { t, tc } = useLang();

  useEffect(() => {
    hydrate();
  }, []);

  const banners = useMemo(
    () => [
      { emoji: "🥬", title: t("b1t"), sub: t("b1b"), cat: "fruits" },
      {
        emoji: "🚚",
        title: t("b2t"),
        sub: `${t("free")} ₹${state.settings.freeDeliveryAbove}+`,
        cat: null,
      },
      { emoji: "🥛", title: t("b3t"), sub: t("b3b"), cat: "dairy" },
    ],
    [t, state.settings.freeDeliveryAbove],
  );

  useEffect(() => {
    const id = setInterval(() => setBanner((b) => (b + 1) % banners.length), 4000);
    return () => clearInterval(id);
  }, [banners.length]);

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.products.filter(
      (p) => (!cat || p.category === cat) && (!q || p.name.toLowerCase().includes(q)),
    );
  }, [state.products, query, cat]);

  const bestsellers = useMemo(
    () => [...state.products].filter((p) => p.stock > 0).slice(0, 10),
    [state.products],
  );
  const deals = useMemo(
    () =>
      [...state.products]
        .filter((p) => p.mrp > p.price && p.stock > 0)
        .sort((a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp)
        .slice(0, 10),
    [state.products],
  );

  const count = cartCount(state);
  const subtotal = cartSubtotal(state);
  const searching = query.trim().length > 0 || cat !== null;
  const activeBanner = banners[banner] ?? banners[0]!;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header query={query} onQuery={setQuery} />

      <main className="mx-auto w-full max-w-5xl flex-1 pb-28">
        {state.settings.announcement && (
          <div className="brand-gradient px-4 pb-3 text-center text-xs font-semibold text-primary-foreground">
            📣 {state.settings.announcement}
          </div>
        )}

        {!searching && (
          <>
            {/* Promo banner carousel */}
            <section className="px-4 pt-4">
              <button
                onClick={() => setCat(activeBanner.cat)}
                className="animate-fade-up relative flex w-full items-center gap-4 overflow-hidden rounded-3xl bg-accent p-5 text-left"
              >
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-card text-4xl shadow-sm">
                  {activeBanner.emoji}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                    <Zap className="h-3 w-3" /> {t("min15")}
                  </span>
                  <span className="block truncate text-lg font-extrabold text-accent-foreground">
                    {activeBanner.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {activeBanner.sub}
                  </span>
                </span>
                <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
                  {t("shopNow")} <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>
              <div className="mt-2 flex justify-center gap-1.5">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setBanner(i)}
                    aria-label={`Banner ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === banner ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </section>

            {/* Category circles */}
            <section className="mt-5 px-4">
              <h2 className="mb-3 text-base font-extrabold">{t("shopByCat")}</h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-6">
                {CATEGORIES.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => setCat(c.id)}
                    className="animate-card-in flex flex-col items-center gap-2"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <span className="grid h-16 w-16 place-items-center rounded-2xl border bg-card text-3xl shadow-sm transition-transform active:scale-90 sm:h-20 sm:w-20">
                      {c.emoji}
                    </span>
                    <span className="text-center text-[11px] font-semibold leading-tight">
                      {tc(c.id, c.name)}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Top deals */}
            {deals.length > 0 && (
              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between px-4">
                  <h2 className="flex items-center gap-1.5 text-base font-extrabold">
                    <Tag className="h-4 w-4 text-secondary" /> {t("topDeals")}
                  </h2>
                  <button
                    onClick={() => setCat("fruits")}
                    className="text-xs font-bold text-primary"
                  >
                    {t("viewAll")} →
                  </button>
                </div>
                <div className="hide-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
                  {deals.map((p, i) => (
                    <div key={p.id} className="w-[40vw] min-w-[8.5rem] max-w-[11rem] shrink-0">
                      <ProductCard product={p} index={i} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Bestsellers */}
            {bestsellers.length > 0 && (
              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between px-4">
                  <h2 className="flex items-center gap-1.5 text-base font-extrabold">
                    <BadgeCheck className="h-4 w-4 text-primary" /> {t("bestsellers")}
                  </h2>
                </div>
                <div className="hide-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
                  {bestsellers.map((p, i) => (
                    <div key={p.id} className="w-[40vw] min-w-[8.5rem] max-w-[11rem] shrink-0">
                      <ProductCard product={p} index={i} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Trust badges */}
            <section className="mx-4 mt-6 grid grid-cols-3 gap-2 rounded-3xl border bg-card p-4">
              {[
                { icon: Leaf, label: t("whyFresh") },
                { icon: Truck, label: t("whyFast") },
                { icon: Tag, label: t("whyPrice") },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-accent">
                    <Icon className="h-5 w-5 text-primary" />
                  </span>
                  <span className="text-[11px] font-semibold leading-tight text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </section>
          </>
        )}

        {/* Product grid (search/filter results or all) */}
        <section className="mt-6 px-4">
          <h2 className="mb-3 text-base font-extrabold">
            {searching
              ? cat
                ? tc(cat, CATEGORIES.find((c) => c.id === cat)?.name ?? "")
                : t("allProducts")
              : t("allProducts")}
          </h2>
          {searching && (
            <div className="hide-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setCat(null)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  cat === null ? "border-primary bg-primary text-primary-foreground" : "bg-card"
                }`}
              >
                {t("all")}
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(cat === c.id ? null : c.id)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    cat === c.id ? "border-primary bg-primary text-primary-foreground" : "bg-card"
                  }`}
                >
                  {c.emoji} {tc(c.id, c.name)}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
          {products.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("noProducts")}</p>
          )}
        </section>
      </main>

      {count > 0 && (
        <Link
          to="/cart"
          className="animate-pop fixed bottom-28 left-1/2 z-40 w-[92%] max-w-md -translate-x-1/2 rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-lg"
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
