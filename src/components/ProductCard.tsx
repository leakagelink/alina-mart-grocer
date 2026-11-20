import { Minus, Plus, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { ProductImage } from "@/components/ProductImage";
import { addToCart, inr, removeOne, useStore, type Product } from "@/lib/store";

export function ProductCard({ product, compact = false }: { product: Product; index?: number; compact?: boolean }) {
  const state = useStore();
  const qty = state.cart.find((c) => c.productId === product.id)?.qty ?? 0;
  const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const out = product.stock <= 0;
  const { t } = useLang();

  return <article className={`grocery-product flex h-full min-w-0 flex-col rounded-lg border bg-card ${compact ? "p-2.5" : "p-3"}`}>
    <Link to="/product/$id" params={{ id: product.id }} aria-label={`${product.name} details`} className="relative grid aspect-square place-items-center overflow-hidden"><ProductImage product={product} className="p-2" />{off > 0 && <span className="absolute left-0 top-0 rounded bg-accent px-1.5 py-1 text-[9px] font-bold text-primary">{off}% {t("off")}</span>}</Link>
    <span className="mt-2 flex w-fit items-center gap-1 rounded bg-muted px-1 py-0.5 text-[9px] font-bold text-muted-foreground"><Clock3 className="h-3 w-3" />{state.settings.deliveryMinutes} MIN</span>
    <Link to="/product/$id" params={{ id: product.id }} className="mt-1 line-clamp-2 min-h-9 text-xs font-semibold leading-[18px]">{product.name}</Link>
    <span className="mb-3 mt-1 text-[11px] text-muted-foreground">{product.unit}</span>
    <div className="mt-auto flex min-h-9 items-center justify-between gap-1"><div className="text-xs font-bold">{inr(product.price)}{off > 0 && <span className="block text-[10px] font-normal text-muted-foreground line-through">{inr(product.mrp)}</span>}</div>
      {out ? <span className="max-w-16 text-[10px] text-muted-foreground">{t("outOfStock")}</span> : qty === 0 ? <Button variant="outline" size="sm" className="h-9 min-w-16 border-primary bg-accent px-2 font-bold text-primary" onClick={() => addToCart(product.id)}>{t("add")}</Button> : <div className="animate-pop flex h-9 items-center rounded-md bg-primary text-primary-foreground"><Button variant="ghost" size="icon" className="h-9 w-6 hover:bg-primary hover:text-primary-foreground" aria-label="Remove one" onClick={() => removeOne(product.id)}><Minus className="!h-3 !w-3" /></Button><span key={qty} className="animate-pop min-w-4 text-center text-xs font-bold">{qty}</span><Button variant="ghost" size="icon" className="h-9 w-6 hover:bg-primary hover:text-primary-foreground" aria-label="Add one" onClick={() => addToCart(product.id)}><Plus className="!h-3 !w-3" /></Button></div>}
    </div>
  </article>;
}
