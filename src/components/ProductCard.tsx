import { Minus, Plus, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { ProductImage } from "@/components/ProductImage";
import { addToCart, inr, removeOne, useStore, type Product } from "@/lib/store";

export function ProductCard({ product, index = 0, compact = false }: { product: Product; index?: number; compact?: boolean }) {
  const state = useStore();
  const qty = state.cart.find((c) => c.productId === product.id)?.qty ?? 0;
  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const out = product.stock <= 0;
  const { t } = useLang();

  if (compact) return <article className="flex h-full min-w-0 flex-col rounded-lg border bg-card p-2.5">
    <Link to="/product/$id" params={{ id: product.id }} aria-label={`${product.name} details`} className="relative grid aspect-square place-items-center overflow-hidden"><ProductImage product={product} className="p-2" />{off > 0 && <span className="absolute left-0 top-0 rounded bg-accent px-1.5 py-1 text-[9px] font-bold text-primary">{off}% {t("off")}</span>}</Link>
    <span className="mt-2 flex items-center gap-1 text-[9px] font-bold text-muted-foreground"><Clock3 className="h-3 w-3" />{state.settings.deliveryMinutes} MIN</span>
    <Link to="/product/$id" params={{ id: product.id }} className="mt-1 line-clamp-2 min-h-9 text-xs font-semibold leading-[18px]">{product.name}</Link>
    <span className="mb-3 mt-1 text-[11px] text-muted-foreground">{product.unit}</span>
    <div className="mt-auto flex min-h-8 items-center justify-between gap-1"><div className="text-xs font-bold">{inr(product.price)}{off > 0 && <span className="block text-[10px] font-normal text-muted-foreground line-through">{inr(product.mrp)}</span>}</div>
      {out ? <span className="text-[10px] text-muted-foreground">{t("outOfStock")}</span> : qty === 0 ? <Button variant="outline" size="sm" className="h-8 min-w-14 border-primary bg-accent px-2 font-bold text-primary" onClick={() => addToCart(product.id)}>{t("add")}</Button> : <div className="flex h-8 items-center rounded-md bg-primary text-primary-foreground"><Button variant="ghost" size="icon" className="h-8 w-6" aria-label="Remove one" onClick={() => removeOne(product.id)}><Minus className="!h-3 !w-3" /></Button><span className="min-w-3 text-center text-xs font-bold">{qty}</span><Button variant="ghost" size="icon" className="h-8 w-6" aria-label="Add one" onClick={() => addToCart(product.id)}><Plus className="!h-3 !w-3" /></Button></div>}
    </div>
  </article>;

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
