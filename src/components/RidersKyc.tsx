import { useEffect, useState } from "react";
import { toast } from "sonner";
import { approveKyc, hydrateAccounts, rejectKyc, useAccounts, type Account } from "@/lib/accounts";

const BADGE: Record<string, string> = {
  not_submitted: "bg-muted text-muted-foreground",
  submitted: "bg-secondary text-secondary-foreground",
  approved: "bg-primary text-primary-foreground",
  rejected: "bg-destructive text-destructive-foreground",
};
const LABEL: Record<string, string> = {
  not_submitted: "KYC pending",
  submitted: "Review needed",
  approved: "Approved",
  rejected: "Rejected",
};

export function RidersKyc() {
  const s = useAccounts();
  useEffect(() => hydrateAccounts(), []);
  const riders = s.accounts
    .filter((a) => a.role === "delivery")
    .sort((a, b) => Number(b.kycStatus === "submitted") - Number(a.kycStatus === "submitted"));
  if (!riders.length) return <p className="py-10 text-center text-sm text-muted-foreground">Koi delivery partner nahi</p>;
  return <div className="mt-4 space-y-3">{riders.map((r) => <RiderCard key={r.id} r={r} />)}</div>;
}

function RiderCard({ r }: { r: Account }) {
  const [open, setOpen] = useState(r.kycStatus === "submitted");
  const [preview, setPreview] = useState<string | null>(null);
  const st = r.kycStatus ?? "not_submitted";
  const k = r.kyc;
  return (
    <div className="animate-card-in rounded-2xl bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <p className="font-extrabold">{r.name}</p>
          <p className="text-xs text-muted-foreground">{r.phone}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${BADGE[st]}`}>{LABEL[st]}</span>
      </div>
      {k && (
        <button onClick={() => setOpen(!open)} className="mt-2 text-xs font-bold text-primary underline">
          {open ? "Details chhupaiye" : "KYC details dekhiye"}
        </button>
      )}
      {k && open && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {[
              ["Naam", k.fullName], ["DOB", k.dob], ["Aadhaar", "XXXX XXXX " + k.aadhaar.slice(-4)], ["PAN", k.pan],
              ["DL", k.dlNumber], ["Vehicle", `${k.vehicleType} • ${k.vehicleNumber}`],
              ["Bank A/c", "XXXX" + k.bankAccount.slice(-4)], ["IFSC", k.ifsc],
            ].map(([a, b]) => (
              <p key={a}><span className="text-muted-foreground">{a}: </span><b>{b}</b></p>
            ))}
            <p className="col-span-2"><span className="text-muted-foreground">Address: </span>{k.address}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {k.docs.map((d) => (
              <button key={d.label} onClick={() => setPreview(d.dataUrl)} className="overflow-hidden rounded-lg border text-left">
                <img src={d.dataUrl} alt={d.label} className="aspect-[4/3] w-full object-cover" />
                <p className="truncate px-1 py-0.5 text-[10px] font-bold">{d.label}</p>
              </button>
            ))}
          </div>
          {st === "submitted" && (
            <div className="flex gap-2">
              <button onClick={() => { approveKyc(r.id); toast.success(`${r.name} approved — ab orders milenge`); }}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-extrabold text-primary-foreground active:scale-95">Approve</button>
              <button onClick={() => {
                const reason = window.prompt("Reject karne ka kaaran?", "Document saaf nahi hai");
                if (reason) { rejectKyc(r.id, reason.slice(0, 200)); toast("KYC rejected"); }
              }} className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-extrabold text-destructive-foreground active:scale-95">Reject</button>
            </div>
          )}
          {st === "approved" && (
            <button onClick={() => { rejectKyc(r.id, "Admin ne account suspend kiya"); toast("Rider suspended"); }}
              className="text-xs font-bold text-destructive underline">Suspend kariye</button>
          )}
        </div>
      )}
      {preview && (
        <button onClick={() => setPreview(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4">
          <img src={preview} alt="Document" className="max-h-full max-w-full rounded-xl" />
        </button>
      )}
    </div>
  );
}
