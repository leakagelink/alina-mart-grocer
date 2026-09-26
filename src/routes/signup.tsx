import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bike, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/alina-logo.jpg.asset.json";
import { hydrateAccounts, logIn, signUp, type Account, type Role } from "@/lib/accounts";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up / Login — Alina Mart" },
      { name: "description", content: "Create your Alina Mart account as a customer or delivery partner." },
      { property: "og:title", content: "Join Alina Mart" },
      { property: "og:description", content: "Customer ya delivery partner ke roop mein account banaiye." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [role, setRole] = useState<Role>("customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");

  useEffect(() => { hydrateAccounts(); }, []);

  const go = (a: Account) => {
    if (a.role === "delivery") nav({ to: a.kycStatus === "approved" ? "/delivery" : "/kyc" });
    else nav({ to: "/" });
  };

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    run();
  };
  const run = (): unknown => {
    void 0;
    const ph = phone.trim();
    if (!/^\d{10}$/.test(ph)) return toast.error("10 digit mobile number daaliye");
    if (!/^\d{4}$/.test(pin)) return toast.error("4 digit PIN daaliye");
    try {
      if (mode === "signup") {
        if (name.trim().length < 2) return toast.error("Naam daaliye");
        const a = signUp({ role, name: name.trim().slice(0, 60), phone: ph, pin });
        toast.success(role === "delivery" ? "Account ban gaya! Ab KYC complete kariye" : "Welcome to Alina Mart!");
        go(a);
      } else {
        const a = logIn(ph, pin);
        toast.success(`Welcome ${a.name}!`);
        go(a);
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const input = "mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm";

  return (
    <div className="flex min-h-screen items-center justify-center brand-gradient p-4">
      <form onSubmit={submit} className="animate-fade-up w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl">
        <img src={logo.url} alt="Alina Mart" className="mx-auto h-16 w-16 rounded-2xl object-cover" />
        <h1 className="mt-2 text-center text-xl font-extrabold">
          {mode === "signup" ? "Account banaiye" : "Login kariye"}
        </h1>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-sm font-bold">
          {(["signup", "login"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`rounded-lg py-2 ${mode === m ? "bg-card shadow" : "text-muted-foreground"}`}>
              {m === "signup" ? "Sign up" : "Login"}
            </button>
          ))}
        </div>

        {mode === "signup" && (
          <>
            <p className="mt-4 text-xs font-bold">Aap kaun hain?</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {([
                { r: "customer", t: "Customer", d: "Saman order karein", I: ShoppingBag },
                { r: "delivery", t: "Delivery Partner", d: "Deliver karke kamaayein", I: Bike },
              ] as const).map(({ r, t, d, I }) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`rounded-2xl border-2 p-3 text-left transition active:scale-95 ${role === r ? "border-primary bg-primary/10" : "border-border"}`}>
                  <I className="h-6 w-6 text-primary" />
                  <p className="mt-1 text-sm font-extrabold">{t}</p>
                  <p className="text-[11px] text-muted-foreground">{d}</p>
                </button>
              ))}
            </div>
            <label className="mt-4 block text-xs font-bold">Poora naam</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={input} maxLength={60} />
          </>
        )}

        <label className="mt-3 block text-xs font-bold">Mobile number</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={10} className={input} placeholder="10 digit number" />
        <label className="mt-3 block text-xs font-bold">4 digit PIN</label>
        <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} type="password" inputMode="numeric" maxLength={4} className={input} />

        <button className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground active:scale-95">
          {mode === "signup" ? "Account banaiye" : "Login"}
        </button>
        <Link to="/" className="mt-3 block text-center text-xs text-muted-foreground underline">Home par wapas</Link>
      </form>
    </div>
  );
}
