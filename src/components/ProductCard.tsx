import { Minus, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { ProductImage } from "@/components/ProductImage";
import { addToCart, inr, removeOne, useStore, type Product } from "@/lib/store";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const state = useStore();
  const qty = state.cart.find((c) => c.productId === product.id)?.qty ?? 0;
  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const out = product.stock <= 0;
  const { t } = useLang();

  return (
    <div
      className="animate-card-in group flex flex-col rounded-3xl bg-card p-2.5 shadow-[var(--shadow-soft)] transition-all hover:shadow-lift"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="relative grid h-28 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-accent via-surface to-card text-6xl"
        aria-label={`${product.name} details`}
      >
        <ProductImage
          product={product}
          className="p-1.5 transition-transform duration-300 group-hover:scale-110"
          emojiClassName="drop-shadow-md transition-transform duration-300 group-hover:scale-110"
        />
        {off > 0 && (
          <span className="absolute left-0 top-0 rounded-br-xl rounded-tl-2xl bg-secondary px-2 py-1 shadow text-[10px] font-bold text-secondary-foreground">
            {off}% {t("off")}
          </span>
        )}
      </Link>
      <Link to="/product/$id" params={{ id: product.id }} className="mt-2 px-1">
        <p className="line-clamp-2 text-sm font-semibold">{product.name}</p>
      </Link>
      <p className="px-1 text-xs text-muted-foreground">{product.unit}</p>
      <div className="mt-auto flex items-center justify-between px-1 pt-2">
        <div>
          <p className="text-base font-extrabold">{inr(product.price)}</p>
          {off > 0 && (
            <p className="text-xs text-muted-foreground line-through">{inr(product.mrp)}</p>
          )}
        </div>
        {out ? (
          <span className="rounded-lg bg-muted px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            {t("outOfStock")}
          </span>
        ) : qty === 0 ? (
          <button
            onClick={() => addToCart(product.id)}
            className="rounded-xl border-2 border-primary bg-accent px-4 py-1.5 text-sm font-extrabold text-primary shadow-sm transition-all hover:bg-primary hover:text-primary-foreground active:scale-90"
          >
            {t("add")}
          </button>
        ) : (
          <div className="animate-pop brand-gradient flex items-center gap-2 rounded-xl px-2 py-1.5 shadow-lift text-primary-foreground">
            <button onClick={() => removeOne(product.id)} aria-label="Remove one">
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-4 text-center text-sm font-bold">{qty}</span>
            <button onClick={() => addToCart(product.id)} aria-label="Add one">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
