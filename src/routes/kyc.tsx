import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, FileUp, LogOut, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { currentAccount, hydrateAccounts, logOut, submitKyc, useAccounts, type KycDoc } from "@/lib/accounts";

export const Route = createFileRoute("/kyc")({
  head: () => ({
    meta: [
      { title: "Delivery Partner KYC — Alina Mart" },
      { name: "description", content: "Submit your KYC documents to start delivering with Alina Mart." },
      { property: "og:title", content: "Delivery Partner KYC — Alina Mart" },
      { property: "og:description", content: "Documents upload karke delivery shuru kariye." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KycPage,
});

const DOCS = ["Aadhaar card (front)", "Aadhaar card (back)", "PAN card", "Driving licence", "Vehicle RC", "Selfie photo"];

function compress(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = rej;
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, 800 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = img.width * s;
        c.height = img.height * s;
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.6));
      };
      img.onerror = () => rej(new Error("Sirf photo (JPG/PNG) upload kariye"));
      img.src = r.result as string;
    };
    r.readAsDataURL(file);
  });
}

function KycPage() {
  const s = useAccounts();
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => { hydrateAccounts(); setReady(true); }, []);
  const acc = currentAccount(s);

  if (!ready) return null;
  if (!acc || acc.role !== "delivery")
    return (
      <Center>
        <p className="font-bold">Pehle delivery partner account se login kariye</p>
        <Link to="/signup" className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Sign up / Login</Link>
      </Center>
    );

  const out = () => { logOut(); nav({ to: "/signup" }); };

  if (acc.kycStatus === "approved")
    return (
      <Center>
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <p className="mt-2 text-lg font-extrabold">KYC approved!</p>
        <p className="text-sm text-muted-foreground">Ab aap orders deliver kar sakte hain.</p>
        <Link to="/delivery" className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">Delivery app kholiye</Link>
      </Center>
    );

  if (acc.kycStatus === "submitted")
    return (
      <Center>
        <Clock className="mx-auto h-14 w-14 text-secondary" />
        <p className="mt-2 text-lg font-extrabold">KYC review mein hai</p>
        <p className="text-sm text-muted-foreground">Admin aapke documents check kar rahe hain. Approve hote hi aapko orders milne lagenge.</p>
        <button onClick={out} className="mt-4 text-xs underline">Logout</button>
      </Center>
    );

  return <KycForm accId={acc.id} name={acc.name} rejectReason={acc.kycStatus === "rejected" ? acc.rejectReason : undefined} onLogout={out} />;
}

function KycForm({ accId, name, rejectReason, onLogout }: { accId: string; name: string; rejectReason?: string | undefined; onLogout: () => void }) {
  const [f, setF] = useState({ fullName: name, dob: "", address: "", aadhaar: "", pan: "", dlNumber: "", vehicleType: "Bike", vehicleNumber: "", bankAccount: "", ifsc: "" });
  const [docs, setDocs] = useState<Record<string, KycDoc>>({});
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const upload = async (label: string, file?: File) => {
    if (!file) return;
    try {
      const dataUrl = await compress(file);
      setDocs((d) => ({ ...d, [label]: { label, fileName: file.name, dataUrl } }));
    } catch (e) { toast.error((e as Error).message); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.fullName.trim() || !f.dob || f.address.trim().length < 10) return toast.error("Naam, DOB aur poora address daaliye");
    if (!/^\d{12}$/.test(f.aadhaar)) return toast.error("Aadhaar 12 digit ka hona chahiye");
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(f.pan.toUpperCase())) return toast.error("PAN sahi format mein daaliye (ABCDE1234F)");
    if (!f.dlNumber.trim() || !f.vehicleNumber.trim()) return toast.error("DL aur vehicle number daaliye");
    if (!/^\d{9,18}$/.test(f.bankAccount) || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(f.ifsc.toUpperCase())) return toast.error("Bank account aur IFSC sahi daaliye");
    const missing = DOCS.filter((d) => !docs[d]);
    if (missing.length) return toast.error(`Upload kariye: ${missing[0]}`);
    try {
      submitKyc(accId, { ...f, pan: f.pan.toUpperCase(), ifsc: f.ifsc.toUpperCase(), docs: DOCS.map((d) => docs[d]!), submittedAt: Date.now() });
      toast.success("KYC submit ho gaya! Admin approval ka intezaar kariye");
    } catch (err) { toast.error((err as Error).message); }
  };

  const inp = "mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm";
  const F = ({ l, k, ...p }: { l: string; k: keyof typeof f } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className="block text-xs font-bold">{l}<input value={f[k]} onChange={set(k)} className={inp} {...p} /></label>
  );

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="brand-gradient px-4 py-5 text-primary-foreground">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <ShieldCheck className="h-8 w-8" />
          <div className="flex-1"><p className="text-lg font-extrabold">KYC verification</p><p className="text-xs opacity-80">Delivery shuru karne ke liye details bhariye</p></div>
          <button onClick={onLogout} aria-label="Logout"><LogOut className="h-5 w-5" /></button>
        </div>
      </div>
      <form onSubmit={submit} className="mx-auto mt-4 max-w-2xl space-y-4 px-4">
        {rejectReason && (
          <div className="flex gap-2 rounded-2xl border border-destructive bg-destructive/10 p-3 text-sm">
            <XCircle className="h-5 w-5 shrink-0 text-destructive" />
            <div><p className="font-bold">KYC reject hua</p><p>{rejectReason}</p><p className="text-xs">Sahi details ke saath dobara submit kariye.</p></div>
          </div>
        )}
        <section className="animate-fade-up space-y-3 rounded-2xl bg-card p-4 shadow-sm">
          <p className="font-extrabold">Personal details</p>
          {F({ l: "Poora naam (Aadhaar jaisa)", k: "fullName", maxLength: 60 })}
          {F({ l: "Date of birth", k: "dob", type: "date" })}
          <label className="block text-xs font-bold">Address<textarea value={f.address} onChange={set("address")} maxLength={200} className={inp} rows={2} /></label>
          {F({ l: "Aadhaar number", k: "aadhaar", inputMode: "numeric", maxLength: 12 })}
          {F({ l: "PAN number", k: "pan", maxLength: 10 })}
        </section>
        <section className="animate-fade-up space-y-3 rounded-2xl bg-card p-4 shadow-sm">
          <p className="font-extrabold">Vehicle</p>
          <label className="block text-xs font-bold">Vehicle type
            <select value={f.vehicleType} onChange={set("vehicleType")} className={inp}>
              {["Bike", "Scooter", "EV Scooter", "Cycle"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
          {F({ l: "Vehicle number", k: "vehicleNumber", maxLength: 15, placeholder: "MP 09 AB 1234" })}
          {F({ l: "Driving licence number", k: "dlNumber", maxLength: 20 })}
        </section>
        <section className="animate-fade-up space-y-3 rounded-2xl bg-card p-4 shadow-sm">
          <p className="font-extrabold">Bank (payout ke liye)</p>
          {F({ l: "Account number", k: "bankAccount", inputMode: "numeric", maxLength: 18 })}
          {F({ l: "IFSC code", k: "ifsc", maxLength: 11 })}
        </section>
        <section className="animate-fade-up rounded-2xl bg-card p-4 shadow-sm">
          <p className="font-extrabold">Documents upload</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {DOCS.map((d) => (
              <label key={d} className="relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center text-[11px] font-bold">
                {docs[d] ? <img src={docs[d].dataUrl} alt={d} className="absolute inset-0 h-full w-full object-cover" /> : <><FileUp className="mb-1 h-5 w-5 text-primary" />{d}</>}
                {docs[d] && <span className="absolute bottom-0 inset-x-0 bg-primary/90 py-0.5 text-primary-foreground">{d} ✓</span>}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(d, e.target.files?.[0])} />
              </label>
            ))}
          </div>
        </section>
        <button className="w-full rounded-xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground active:scale-95">KYC submit kariye</button>
      </form>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="animate-fade-up w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-xl">{children}</div>
    </div>
  );
}
