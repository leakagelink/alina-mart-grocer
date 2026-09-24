import { Minus, Plus } from "lucide-react";
import { addToCart, inr, removeOne, useStore, type Product } from "@/lib/store";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const state = useStore();
  const qty = state.cart.find((c) => c.productId === product.id)?.qty ?? 0;
  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const out = product.stock <= 0;

  return (
    <div
      className="animate-card-in flex flex-col rounded-2xl border bg-card p-3 transition-shadow hover:shadow-lg"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="relative grid h-24 place-items-center rounded-xl bg-surface text-5xl">
        <span>{product.emoji}</span>
        {off > 0 && (
          <span className="absolute left-1 top-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-secondary-foreground">
            {off}% OFF
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold">{product.name}</p>
      <p className="text-xs text-muted-foreground">{product.unit}</p>
      <div className="mt-auto flex items-center justify-between pt-2">
        <div>
          <p className="text-sm font-bold">{inr(product.price)}</p>
          {off > 0 && (
            <p className="text-xs text-muted-foreground line-through">{inr(product.mrp)}</p>
          )}
        </div>
        {out ? (
          <span className="rounded-lg bg-muted px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Out of stock
          </span>
        ) : qty === 0 ? (
          <button
            onClick={() => addToCart(product.id)}
            className="rounded-lg border border-primary px-3 py-1.5 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-90"
          >
            ADD
          </button>
        ) : (
          <div className="animate-pop flex items-center gap-2 rounded-lg bg-primary px-2 py-1 text-primary-foreground">
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
