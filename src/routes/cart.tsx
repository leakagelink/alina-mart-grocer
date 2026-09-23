import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import {
  DELIVERY_FEE,
  FREE_DELIVERY_ABOVE,
  addToCart,
  cartSubtotal,
  clearCart,
  hydrate,
  inr,
  removeOne,
  useStore,
} from "@/lib/store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Alina Mart" },
      { name: "description", content: "Review your Alina Mart basket and checkout in seconds." },
      { property: "og:title", content: "Your Cart — Alina Mart" },
      { property: "og:description", content: "Review your basket and checkout in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const state = useStore();
  useEffect(() => {
    hydrate();
  }, []);

  const subtotal = cartSubtotal(state);
  const fee = subtotal >= FREE_DELIVERY_ABOVE || subtotal === 0 ? 0 : DELIVERY_FEE;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-8 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Your cart</h1>
          {state.cart.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1 text-sm text-muted-foreground"
            >
              <Trash2 className="h-4 w-4" /> Clear
            </button>
          )}
        </div>

        {state.cart.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-5xl">🛒</p>
            <p className="mt-3 text-sm text-muted-foreground">Cart khaali hai.</p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-3">
              {state.cart.map((line) => {
                const p = state.products.find((x) => x.id === line.productId);
                if (!p) return null;
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
                    <span className="grid h-14 w-14 place-items-center rounded-xl bg-surface text-3xl">
                      {p.emoji}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.unit}</p>
                      <p className="text-sm font-bold">{inr(p.price)}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-2 py-1 text-primary-foreground">
                      <button onClick={() => removeOne(p.id)} aria-label="Remove one">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-4 text-center text-sm font-bold">{line.qty}</span>
                      <button onClick={() => addToCart(p.id)} aria-label="Add one">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl border bg-card p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Item total</span>
                <span className="font-semibold">{inr(subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-muted-foreground">Delivery fee</span>
                <span className="font-semibold">{fee === 0 ? "FREE" : inr(fee)}</span>
              </div>
              {fee > 0 && (
                <p className="mt-2 text-xs text-secondary">
                  {inr(FREE_DELIVERY_ABOVE - subtotal)} aur add karein — delivery free!
                </p>
              )}
              <div className="mt-3 flex justify-between border-t pt-3 text-base font-bold">
                <span>To pay</span>
                <span>{inr(subtotal + fee)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="mt-4 block rounded-xl bg-primary py-3 text-center text-sm font-bold text-primary-foreground"
            >
              Proceed to checkout
            </Link>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
