import { BackButton } from "@/components/BackButton";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bike, ChevronRight, Home, KeyRound, LogOut, MapPin, Pencil, Plus, ShoppingBag, Star, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/alina-logo.jpg.asset.json";
import { changePassword, currentAccount, deleteAddress, hydrateAccounts, logIn, logOut, saveAddress, setDefaultAddress, signUp, updateProfile, useAccounts, type Account, type Address, type Role } from "@/lib/accounts";

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
  const [password, setPassword] = useState("");

  useEffect(() => { hydrateAccounts(); }, []);

  const go = (a: Account) => {
    if (a.role === "admin") nav({ to: "/admin" });
    else if (a.role === "delivery") nav({ to: a.kycStatus === "approved" ? "/delivery" : "/kyc" });
    else nav({ to: "/" });
  };

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    run();
  };
  const run = async (): Promise<unknown> => {
    void 0;
    const ph = phone.trim();
    if (!/^\d{10}$/.test(ph)) return toast.error("10 digit mobile number daaliye");
    if (password.length < 6) return toast.error("Password kam se kam 6 characters ka hona chahiye");
    try {
      if (mode === "signup") {
        if (name.trim().length < 2) return toast.error("Naam daaliye");
        const a = await signUp({ role, name: name.trim().slice(0, 60), phone: ph, password });
        toast.success(role === "delivery" ? "Account ban gaya! Ab KYC complete kariye" : "Welcome to Alina Mart!");
        go(a);
      } else {
        const a = await logIn(ph, password);
        toast.success(`Welcome ${a.name}!`);
        go(a);
      }
    } catch (err) {
      toast.error((err as Error).message);
    }

    return undefined;
  };

  const input = "mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm";
  const accState = useAccounts();
  const me = currentAccount(accState);

  if (me) return <ProfileView me={me} />;

  return (
    <div className="flex min-h-screen items-center justify-center brand-gradient p-4">
      <BackButton floating />
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
        <label className="mt-3 block text-xs font-bold">Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" maxLength={40} className={input} placeholder="Kam se kam 6 characters" />

        <button className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground active:scale-95">
          {mode === "signup" ? "Account banaiye" : "Login"}
        </button>
        <Link to="/" className="mt-3 block text-center text-xs text-muted-foreground underline">Home par wapas</Link>
      </form>
    </div>
  );
}

// ================= PROFILE VIEW =================

type Tab = "profile" | "addresses" | "password";

function ProfileView({ me }: { me: Account }) {
  const [tab, setTab] = useState<Tab>("profile");
  const input = "mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm";

  return (
    <div className="min-h-screen brand-gradient p-4 pb-10 pt-16">
      <BackButton floating />
      <div className="animate-fade-up mx-auto w-full max-w-md">
        {/* Header card */}
        <div className="rounded-3xl bg-card p-5 text-center shadow-2xl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-2 text-xl font-extrabold">{me.name}</h1>
          <p className="text-sm text-muted-foreground">{me.phone}</p>
          <p className="mt-1 inline-block rounded-full bg-muted px-3 py-1 text-xs font-bold capitalize">
            {me.role === "delivery" ? "Delivery Partner" : me.role}
          </p>
        </div>

        {/* Quick links */}
        <div className="mt-3 space-y-2 rounded-3xl bg-card p-4 shadow-xl">
          {me.role === "admin" && (
            <QuickLink to="/admin" label="Admin Panel" />
          )}
          {me.role === "delivery" && (
            <QuickLink to={me.kycStatus === "approved" ? "/delivery" : "/kyc"} label={me.kycStatus === "approved" ? "Delivery Panel" : "KYC Status"} />
          )}
          {me.role === "customer" && (
            <QuickLink to="/orders" label="Mere Orders" />
          )}
          <QuickLink to="/" label="Home par wapas" />
        </div>

        {/* Tabs */}
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-card p-1 text-xs font-bold shadow-xl">
          {([
            { t: "profile", label: "Profile", I: User },
            { t: "addresses", label: "Addresses", I: MapPin },
            { t: "password", label: "Password", I: KeyRound },
          ] as const).map(({ t, label, I }) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center justify-center gap-1 rounded-xl py-2.5 ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              <I className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-3xl bg-card p-5 shadow-xl">
          {tab === "profile" && <ProfileTab me={me} input={input} />}
          {tab === "addresses" && <AddressesTab me={me} input={input} />}
          {tab === "password" && <PasswordTab me={me} input={input} />}
        </div>

        <button
          onClick={async () => { await logOut(); toast.success("Logout ho gaya"); }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-card py-3 text-sm font-extrabold text-destructive shadow-xl active:scale-95"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm font-bold active:scale-95">
      {label} <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function ProfileTab({ me, input }: { me: Account; input: string }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(me.name);

  const save = async () => {
    try {
      await updateProfile(me.id, { name });
      setEditing(false);
      toast.success("Profile update ho gaya");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold">Profile Details</h2>
        {!editing && (
          <button onClick={() => { setName(me.name); setEditing(true); }} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-bold active:scale-95">
            <Pencil className="h-3 w-3" /> Edit
          </button>
        )}
      </div>
      <label className="mt-4 block text-xs font-bold">Poora naam</label>
      {editing ? (
        <>
          <input value={name} onChange={(e) => setName(e.target.value)} className={input} maxLength={60} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={save} className="rounded-xl bg-primary py-2.5 text-sm font-extrabold text-primary-foreground active:scale-95">Save</button>
            <button onClick={() => setEditing(false)} className="rounded-xl bg-muted py-2.5 text-sm font-bold active:scale-95">Cancel</button>
          </div>
        </>
      ) : (
        <p className="mt-1 rounded-xl bg-muted px-3 py-2.5 text-sm">{me.name}</p>
      )}
      <label className="mt-3 block text-xs font-bold">Mobile number</label>
      <p className="mt-1 rounded-xl bg-muted px-3 py-2.5 text-sm text-muted-foreground">{me.phone} (change nahi ho sakta)</p>
      <label className="mt-3 block text-xs font-bold">Account type</label>
      <p className="mt-1 rounded-xl bg-muted px-3 py-2.5 text-sm capitalize text-muted-foreground">
        {me.role === "delivery" ? "Delivery Partner" : me.role}
      </p>
    </div>
  );
}

function AddressesTab({ me, input }: { me: Account; input: string }) {
  const [form, setForm] = useState<Address | null>(null);
  const list = me.addresses ?? [];

  const startAdd = () => setForm({ id: "a" + Date.now(), label: "Home", line: "", landmark: "", pincode: "", isDefault: list.length === 0 });
  const save = (): void => {
    if (!form) return;
    if (form.line.trim().length < 8) { toast.error("Poora address likhiye"); return; }
    if (!/^\d{6}$/.test(form.pincode)) { toast.error("6 digit pincode daaliye"); return; }
    try {
      await saveAddress(me.id, { ...form, line: form.line.trim() });
      setForm(null);
      toast.success("Address save ho gaya");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold">Saved Addresses</h2>
        {!form && (
          <button onClick={startAdd} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground active:scale-95">
            <Plus className="h-3 w-3" /> Add
          </button>
        )}
      </div>

      {form && (
        <div className="mt-3 rounded-2xl border p-3">
          <div className="flex gap-1.5">
            {["Home", "Office", "Other"].map((l) => (
              <button key={l} onClick={() => setForm({ ...form, label: l })}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${form.label === l ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {l}
              </button>
            ))}
          </div>
          <label className="mt-3 block text-xs font-bold">Poora address</label>
          <textarea value={form.line} onChange={(e) => setForm({ ...form, line: e.target.value })} rows={2} className={input} placeholder="House no, gali, area..." />
          <label className="mt-2 block text-xs font-bold">Landmark (optional)</label>
          <input value={form.landmark ?? ""} onChange={(e) => setForm({ ...form, landmark: e.target.value })} className={input} placeholder="Masjid ke paas..." />
          <label className="mt-2 block text-xs font-bold">Pincode</label>
          <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })} inputMode="numeric" maxLength={6} className={input} />
          <label className="mt-2 flex items-center gap-2 text-xs font-bold">
            <input type="checkbox" checked={!!form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} /> Default address banaiye
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={save} className="rounded-xl bg-primary py-2.5 text-sm font-extrabold text-primary-foreground active:scale-95">Save</button>
            <button onClick={() => setForm(null)} className="rounded-xl bg-muted py-2.5 text-sm font-bold active:scale-95">Cancel</button>
          </div>
        </div>
      )}

      {list.length === 0 && !form && (
        <p className="mt-4 rounded-xl bg-muted p-4 text-center text-xs text-muted-foreground">
          Koi address save nahi hai. "Add" dabakar apna delivery address save kariye — checkout me kaam aayega.
        </p>
      )}

      <div className="mt-3 space-y-2">
        {list.map((a) => (
          <div key={a.id} className="rounded-2xl border p-3">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-extrabold">
                <Home className="h-3.5 w-3.5 text-primary" /> {a.label}
                {a.isDefault && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Default</span>}
              </p>
              <div className="flex gap-1">
                {!a.isDefault && (
                  <button onClick={() => { setDefaultAddress(me.id, a.id); toast.success("Default address badla"); }} title="Default banaiye"
                    className="grid h-7 w-7 place-items-center rounded-lg bg-muted active:scale-95"><Star className="h-3.5 w-3.5" /></button>
                )}
                <button onClick={() => setForm({ ...a })} title="Edit"
                  className="grid h-7 w-7 place-items-center rounded-lg bg-muted active:scale-95"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => { deleteAddress(me.id, a.id); toast.success("Address delete ho gaya"); }} title="Delete"
                  className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-destructive active:scale-95"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{a.line}{a.landmark ? `, ${a.landmark}` : ""} — {a.pincode}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PasswordTab({ me, input }: { me: Account; input: string }) {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");

  const save = (): void => {
    if (newPw !== confirm) { toast.error("Naya password confirm se match nahi hua"); return; }
    try {
      await changePassword(me.id, oldPw, newPw);
      setOldPw(""); setNewPw(""); setConfirm("");
      toast.success("Password badal gaya");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div>
      <h2 className="text-sm font-extrabold">Password Badliye</h2>
      <label className="mt-4 block text-xs font-bold">Purana password</label>
      <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} className={input} maxLength={40} />
      <label className="mt-3 block text-xs font-bold">Naya password</label>
      <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={input} maxLength={40} placeholder="Kam se kam 6 characters" />
      <label className="mt-3 block text-xs font-bold">Naya password dobara</label>
      <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} maxLength={40} />
      <button onClick={save} className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground active:scale-95">
        Password Update Kariye
      </button>
    </div>
  );
}
