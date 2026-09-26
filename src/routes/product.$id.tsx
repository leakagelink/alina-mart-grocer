import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Minus, Plus, Clock, ShieldCheck, RotateCcw, Zap } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { useLang } from "@/lib/i18n";
import {
  addToCart,
  CATEGORIES,
  inr,
  removeOne,
  useStore,
} from "@/lib/store";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    if (!params.id) throw notFound();
    return { id: params.id };
  },
  head: () => ({
    meta: [
      { title: "Product — Alina Mart" },
      { name: "description", content: "Product details, price and offers on Alina Mart." },
      { property: "og:title", content: "Product — Alina Mart" },
      { property: "og:description", content: "Product details, price and offers on Alina Mart." },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useLoaderData();
  const state = useStore();
  const { t } = useLang();
  const product = state.products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center">
          <p className="text-5xl">😕</p>
          <h1 className="mt-4 text-xl font-bold">Product nahi mila</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ye product ab available nahi hai.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
          >
            Home par jayein
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  const qty = state.cart.find((c) => c.productId === product.id)?.qty ?? 0;
  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const out = product.stock <= 0;
  const category = CATEGORIES.find((c) => c.id === product.category);
  const similar = state.products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 8);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-32 pt-4">
        {/* Product hero */}
        <div className="animate-fade-up relative grid h-56 place-items-center rounded-3xl border bg-surface text-8xl sm:h-64">
          <span>{product.emoji}</span>
          {off > 0 && (
            <span className="absolute left-3 top-3 rounded-lg bg-secondary px-2 py-1 text-xs font-bold text-secondary-foreground">
              {off}% {t("off")}
            </span>
          )}
          {out && (
            <span className="absolute inset-0 grid place-items-center rounded-3xl bg-background/70 text-base font-bold text-muted-foreground">
              {t("outOfStock")}
            </span>
          )}
        </div>

        {/* Name & price */}
        <div className="animate-fade-up mt-4" style={{ animationDelay: "60ms" }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {category?.emoji} {category?.name}
          </p>
          <h1 className="mt-1 text-2xl font-black">{product.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{product.unit}</p>

          <div className="mt-3 flex items-end gap-2">
            <p className="text-2xl font-black">{inr(product.price)}</p>
            {off > 0 && (
              <p className="pb-0.5 text-sm text-muted-foreground line-through">
                MRP {inr(product.mrp)}
              </p>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">(Sabhi taxes samet)</p>
        </div>

        {/* Delivery promise */}
        <div
          className="animate-fade-up mt-4 grid grid-cols-3 gap-2"
          style={{ animationDelay: "120ms" }}
        >
          {[
            { icon: Zap, title: `${state.settings.deliveryMinutes} min`, sub: "Fast delivery" },
            { icon: ShieldCheck, title: "Quality", sub: "Checked fresh" },
            { icon: RotateCcw, title: "Easy return", sub: "No questions" },
          ].map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center gap-1 rounded-2xl border bg-card px-2 py-3 text-center"
            >
              <f.icon className="h-5 w-5 text-primary" />
              <p className="text-xs font-bold">{f.title}</p>
              <p className="text-[10px] text-muted-foreground">{f.sub}</p>
            </div>
          ))}
        </div>

        {/* Details */}
        <div
          className="animate-fade-up mt-4 rounded-2xl border bg-card p-4"
          style={{ animationDelay: "180ms" }}
        >
          <h2 className="text-sm font-bold">Product details</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            {[
              ["Category", `${category?.emoji ?? ""} ${category?.name ?? product.category}`],
              ["Pack size", product.unit],
              ["Availability", out ? "Out of stock" : product.stock < 10 ? `Sirf ${product.stock} bache hain` : "In stock"],
              ["Delivery", `${state.settings.deliveryMinutes} minute me`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Similar products */}
        {similar.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
              <Clock className="h-4 w-4 text-primary" /> Similar products
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {similar.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Sticky add-to-cart bar */}
      <div className="fixed inset-x-0 bottom-14 z-30 border-t bg-card/95 px-4 py-3 backdrop-blur sm:bottom-0">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{product.name}</p>
            <p className="text-xs text-muted-foreground">
              {product.unit} · {inr(product.price)}
            </p>
          </div>
          {out ? (
            <span className="shrink-0 rounded-xl bg-muted px-4 py-2.5 text-sm font-semibold text-muted-foreground">
              {t("outOfStock")}
            </span>
          ) : qty === 0 ? (
            <button
              onClick={() => addToCart(product.id)}
              className="shrink-0 rounded-xl bg-primary px-8 py-2.5 text-sm font-bold text-primary-foreground transition-transform active:scale-95"
            >
              {t("add")}
            </button>
          ) : (
            <div className="animate-pop flex shrink-0 items-center gap-3 rounded-xl bg-primary px-3 py-2 text-primary-foreground">
              <button onClick={() => removeOne(product.id)} aria-label="Remove one">
                <Minus className="h-5 w-5" />
              </button>
              <span className="min-w-5 text-center text-base font-bold">{qty}</span>
              <button onClick={() => addToCart(product.id)} aria-label="Add one">
                <Plus className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
