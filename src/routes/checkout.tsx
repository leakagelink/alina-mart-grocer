import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Banknote, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Header } from "@/components/Header";
import {
  DELIVERY_FEE,
  FREE_DELIVERY_ABOVE,
  cartSubtotal,
  hydrate,
  inr,
  placeOrder,
  useStore,
} from "@/lib/store";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Alina Mart" },
      {
        name: "description",
        content: "Pay by cash on delivery or online and get your Alina Mart order in 15 minutes.",
      },
      { property: "og:title", content: "Checkout — Alina Mart" },
      { property: "og:description", content: "Cash on delivery or online payment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  name: z.string().trim().min(2, "Naam likhein").max(60),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "10 digit mobile number daalein"),
  address: z.string().trim().min(10, "Pura address likhein").max(300),
});

function Checkout() {
  const navigate = useNavigate();
  const state = useStore();
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [payment, setPayment] = useState<"cod" | "online">("cod");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    hydrate();
  }, []);

  const subtotal = cartSubtotal(state);
  const fee = subtotal >= FREE_DELIVERY_ABOVE || subtotal === 0 ? 0 : DELIVERY_FEE;

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Details check karein");
      return;
    }
    if (state.cart.length === 0) {
      toast.error("Cart khaali hai");
      return;
    }
    setBusy(true);
    if (payment === "online") {
      await new Promise((r) => setTimeout(r, 1200));
    }
    const order = placeOrder({ customer: parsed.data, payment });
    setBusy(false);
    if (!order) return;
    toast.success(payment === "online" ? "Payment successful" : "Order placed — COD");
    navigate({ to: "/orders/$id", params: { id: order.id } });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10 pt-4">
        <h1 className="text-lg font-bold">Checkout</h1>

        <div className="animate-fade-up mt-4 space-y-3 rounded-2xl border bg-card p-4">
          <p className="text-sm font-bold">Delivery details</p>
          <input
            value={form.name}
            maxLength={60}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Full name"
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={form.phone}
            maxLength={10}
            inputMode="numeric"
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
            placeholder="Mobile number"
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            value={form.address}
            maxLength={300}
            rows={3}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="House no, street, landmark, city, pincode"
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="mt-4 rounded-2xl border bg-card p-4">
          <p className="text-sm font-bold">Payment method</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setPayment("cod")}
              className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-semibold ${
                payment === "cod" ? "border-primary bg-accent text-accent-foreground" : ""
              }`}
            >
              <Banknote className="h-5 w-5 text-primary" /> Cash on Delivery
            </button>
            <button
              onClick={() => setPayment("online")}
              className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-semibold ${
                payment === "online" ? "border-primary bg-accent text-accent-foreground" : ""
              }`}
            >
              <CreditCard className="h-5 w-5 text-secondary" /> Online (UPI / Card)
            </button>
          </div>
          {payment === "online" && (
            <p className="mt-2 text-xs text-muted-foreground">
              Demo mode: payment simulate hota hai. Live gateway baad mein jodenge.
            </p>
          )}
        </div>

        <div className="mt-4 rounded-2xl border bg-card p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Item total</span>
            <span className="font-semibold">{inr(subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-muted-foreground">Delivery fee</span>
            <span className="font-semibold">{fee === 0 ? "FREE" : inr(fee)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t pt-3 text-base font-bold">
            <span>To pay</span>
            <span>{inr(subtotal + fee)}</span>
          </div>
        </div>

        <button
          disabled={busy}
          onClick={submit}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-bold text-secondary-foreground disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {payment === "cod" ? "Place order (COD)" : `Pay ${inr(subtotal + fee)}`}
        </button>
      </main>
    </div>
  );
}
