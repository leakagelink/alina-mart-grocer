import { BackButton } from "@/components/BackButton";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, FileUp, LogOut, ShieldCheck, Store, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  currentAccount,
  hydrateAccounts,
  logOut,
  submitVendorApplication,
  useAccounts,
  type KycDoc,
  type VendorApplication,
} from "@/lib/accounts";
import { compressImage } from "@/lib/image";

export const Route = createFileRoute("/vendor-kyc")({
  head: () => ({
    meta: [
      { title: "Vendor Application — Martigo" },
      {
        name: "description",
        content: "Submit your shop details, bank account and documents to start selling on Martigo.",
      },
      { property: "og:title", content: "Vendor Application — Martigo" },
      { property: "og:description", content: "Apni dukaan register kariye aur bechna shuru kariye." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VendorKycPage,
});

const DOCS = ["Aadhaar card", "PAN card", "Shop photo", "Cancelled cheque"];

function VendorKycPage() {
  const s = useAccounts();
  const nav = useNavigate();
  useEffect(() => {
    hydrateAccounts();
  }, []);
  const acc = currentAccount(s);

  if (!s.ready) return null;
  if (!acc || acc.role !== "vendor")
    return (
      <Center>
        <p className="font-bold">Pehle vendor account se login kariye</p>
        <Link
          to="/signup"
          className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          Sign up / Login
        </Link>
      </Center>
    );

  const out = () => {
    logOut();
    nav({ to: "/signup" });
  };

  if (acc.vendorStatus === "approved")
    return (
      <Center>
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <p className="mt-2 text-lg font-extrabold">Vendor account approved!</p>
        <p className="text-sm text-muted-foreground">Ab aap apne products bech sakte hain.</p>
        <Link
          to="/vendor"
          className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          Vendor panel kholiye
        </Link>
      </Center>
    );

  if (acc.vendorStatus === "submitted")
    return (
      <Center>
        <Clock className="mx-auto h-14 w-14 text-secondary" />
        <p className="mt-2 text-lg font-extrabold">Application review mein hai</p>
        <p className="text-sm text-muted-foreground">
          Admin aapki dukaan ki details check kar rahe hain. Approve hote hi aap products add kar
          sakenge.
        </p>
        <button onClick={out} className="mt-4 text-xs underline">
          Logout
        </button>
      </Center>
    );

  return (
    <VendorForm
      accId={acc.id}
      name={acc.name}
      phone={acc.phone}
      vendor={acc.vendor}
      rejectReason={acc.vendorStatus === "rejected" ? acc.vendor?.rejectReason ?? undefined : undefined}
      onLogout={out}
    />
  );
}

function VendorForm({
  accId,
  name,
  phone,
  vendor,
  rejectReason,
  onLogout,
}: {
  accId: string;
  name: string;
  phone: string;
  vendor: VendorApplication | undefined;
  rejectReason: string | undefined;
  onLogout: () => void;
}) {
  const [f, setF] = useState({
    shopName: vendor?.shopName ?? "",
    ownerName: name,
    address: vendor?.address ?? "",
    gst: vendor?.gst ?? "",
    bankAccount: vendor?.bankAccount ?? "",
    ifsc: vendor?.ifsc ?? "",
  });
  const [docs, setDocs] = useState<Record<string, KycDoc>>(
    Object.fromEntries((vendor?.docs ?? []).map((d) => [d.label, d])),
  );
  const [gstDoc, setGstDoc] = useState<KycDoc | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  const upload = async (label: string, file?: File) => {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      const doc = { label, fileName: file.name, dataUrl };
      if (label === "GST certificate") setGstDoc(doc);
      else setDocs((d) => ({ ...d, [label]: doc }));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = DOCS.filter((d) => !docs[d]);
    if (missing.length) return toast.error(`Upload kariye: ${missing[0]}`);
    try {
      await submitVendorApplication(accId, {
        ...f,
        docs: [...DOCS.map((d) => docs[d]!), ...(gstDoc ? [gstDoc] : [])],
      });
      toast.success("Application submit ho gaya! Admin approval ka intezaar kariye");
    } catch (err) {
      toast.error((err as Error).message);
    }
    return undefined;
  };

  const inp = "mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm";
  const F = ({ l, k, ...p }: { l: string; k: keyof typeof f } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className="block text-xs font-bold">
      {l}
      <input value={f[k]} onChange={set(k)} className={inp} {...p} />
    </label>
  );

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="brand-gradient px-4 py-5 text-primary-foreground">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <BackButton />
          <Store className="h-8 w-8" />
          <div className="flex-1">
            <p className="text-lg font-extrabold">Vendor application</p>
            <p className="text-xs opacity-80">Apni dukaan register karke bechna shuru kariye</p>
          </div>
          <button onClick={onLogout} aria-label="Logout">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="mx-auto mt-4 max-w-2xl space-y-4 px-4">
        {rejectReason && (
          <div className="flex gap-2 rounded-2xl border border-destructive bg-destructive/10 p-3 text-sm">
            <XCircle className="h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-bold">Application reject hua</p>
              <p>{rejectReason}</p>
              <p className="text-xs">Sahi details ke saath dobara submit kariye.</p>
            </div>
          </div>
        )}

        <section className="animate-fade-up space-y-3 rounded-2xl bg-card p-4 shadow-sm">
          <p className="font-extrabold">Dukaan ki details</p>
          {F({ l: "Dukaan ka naam", k: "shopName", maxLength: 60, placeholder: "Sharma Kirana Store" })}
          {F({ l: "Maalik ka naam", k: "ownerName", maxLength: 60 })}
          <label className="block text-xs font-bold">
            Dukaan ka address
            <textarea value={f.address} onChange={set("address")} maxLength={200} className={inp} rows={2} />
          </label>
          {F({ l: "GST number (optional)", k: "gst", maxLength: 20 })}
          <p className="text-[11px] text-muted-foreground">Mobile number: {phone}</p>
        </section>

        <section className="animate-fade-up space-y-3 rounded-2xl bg-card p-4 shadow-sm">
          <p className="font-extrabold">Bank account (payout ke liye)</p>
          {F({ l: "Account number", k: "bankAccount", inputMode: "numeric", maxLength: 18 })}
          {F({ l: "IFSC code", k: "ifsc", maxLength: 11, placeholder: "HDFC0001234" })}
        </section>

        <section className="animate-fade-up rounded-2xl bg-card p-4 shadow-sm">
          <p className="font-extrabold">Documents upload</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {DOCS.map((d) => (
              <label
                key={d}
                className="relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center text-[11px] font-bold"
              >
                {docs[d] ? (
                  <img src={docs[d].dataUrl} alt={d} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <>
                    <FileUp className="mb-1 h-5 w-5 text-primary" />
                    {d}
                  </>
                )}
                {docs[d] && (
                  <span className="inset-x-0 absolute bottom-0 bg-primary/90 py-0.5 text-primary-foreground">
                    {d} ✓
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => upload(d, e.target.files?.[0])}
                />
              </label>
            ))}
            <label className="relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center text-[11px] font-bold">
              {gstDoc ? (
                <img src={gstDoc.dataUrl} alt="GST certificate" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <>
                  <ShieldCheck className="mb-1 h-5 w-5 text-muted-foreground" />
                  GST certificate (optional)
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => upload("GST certificate", e.target.files?.[0])}
              />
            </label>
          </div>
        </section>

        <button className="w-full rounded-xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground active:scale-95">
          Application submit kariye
        </button>
      </form>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="animate-fade-up w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-xl">
        {children}
      </div>
    </div>
  );
}
