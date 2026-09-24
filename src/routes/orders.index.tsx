import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { STATUS_LABEL, hydrate, inr, useStore } from "@/lib/store";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "My Orders — Alina Mart" },
      { name: "description", content: "Track your Alina Mart grocery orders in real time." },
      { property: "og:title", content: "My Orders — Alina Mart" },
      { property: "og:description", content: "Track your grocery orders in real time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Orders,
});

function Orders() {
  const state = useStore();
  useEffect(() => {
    hydrate();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-8 pt-4">
        <h1 className="text-lg font-bold">My orders</h1>
        {state.orders.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Abhi koi order nahi hai.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {state.orders.map((o, i) => (
              <Link
                key={o.id}
                to="/orders/$id"
                params={{ id: o.id }}
                className="animate-card-in block rounded-2xl border bg-card p-4 transition-shadow hover:shadow-lg"
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">#{o.id}</span>
                  <span className="rounded-lg bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
                    {STATUS_LABEL[o.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleString("en-IN")} • {o.items.length} items •{" "}
                  {o.payment === "cod" ? "COD" : "Online"}
                </p>
                <p className="mt-2 text-sm font-bold">{inr(o.total)}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
