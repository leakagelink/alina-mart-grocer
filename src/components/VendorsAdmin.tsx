import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IndianRupee, Store } from "lucide-react";
import {
  approveVendor,
  currentAccount,
  hydrateAccounts,
  rejectVendor,
  useAccounts,
  type Account,
} from "@/lib/accounts";
import { hydrateVendor, markVendorPayoutPaid, useVendorStore } from "@/lib/vendor";
import { inr } from "@/lib/store";

const BADGE: Record<string, string> = {
  not_submitted: "bg-muted text-muted-foreground",
  submitted: "bg-secondary text-secondary-foreground",
  approved: "bg-primary text-primary-foreground",
  rejected: "bg-destructive text-destructive-foreground",
};
const LABEL: Record<string, string> = {
  not_submitted: "Application pending",
  submitted: "Review needed",
  approved: "Approved",
  rejected: "Rejected",
};

export function VendorsAdmin() {
  const s = useAccounts();
  const v = useVendorStore();
  const me = currentAccount(s);
  useEffect(() => {
    hydrateAccounts();
    hydrateVendor();
  }, []);
  const [f, setF] = useState("all");
  const [tab, setTab] = useState<"vendors" | "payouts">("vendors");

  const all = s.accounts.filter((a) => a.role === "vendor");
  const list = all
    .filter((a) => f === "all" || (a.vendorStatus ?? "not_submitted") === f)
    .sort((a, b) => Number(b.vendorStatus === "submitted") - Number(a.vendorStatus === "submitted"));

  const pending = v.payouts.filter((p) => p.status === "pending");

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-card p-1 text-xs font-bold shadow-sm">
        {([
          { t: "vendors", label: `Vendors (${all.length})` },
          { t: "payouts", label: `Payouts (${pending.length})` },
        ] as const).map((x) => (
          <button
            key={x.t}
            onClick={() => setTab(x.t)}
            className={`rounded-xl py-2.5 ${tab === x.t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === "payouts" ? (
        <div className="mt-3 space-y-2">
          {pending.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Koi payout request nahi hai.</p>
          )}
          {pending.map((p) => {
            const owner = s.accounts.find((a) => a.id === p.vendorId);
            return (
              <div key={p.id} className="animate-card-in rounded-2xl border bg-card p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate">{owner?.vendor?.shopName || owner?.name || "Vendor"}</p>
                    <p className="text-xs text-muted-foreground">
                      {owner?.phone ?? ""} • Requested {new Date(p.at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span className="text-sm font-extrabold">{inr(p.amount)}</span>
                  <button
                    onClick={async () => {
                      try {
                        await markVendorPayoutPaid(p);
                        toast.success("Payout paid mark ho gaya");
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    }}
                    className="rounded-xl bg-primary px-3 py-2 text-xs font-extrabold text-primary-foreground active:scale-95"
                  >
                    Mark paid
                  </button>
                </div>
              </div>
            );
          })}
          {v.payouts.filter((p) => p.status === "paid").length > 0 && (
            <p className="pt-2 text-xs font-bold text-muted-foreground">Paid payouts</p>
          )}
          {v.payouts
            .filter((p) => p.status === "paid")
            .slice(0, 20)
            .map((p) => {
              const owner = s.accounts.find((a) => a.id === p.vendorId);
              return (
                <div key={p.id} className="rounded-2xl border bg-card p-3 text-xs">
                  <span className="font-bold">{owner?.vendor?.shopName || owner?.name || "Vendor"}</span>
                  <span className="text-muted-foreground"> • {inr(p.amount)} • paid</span>
                </div>
              );
            })}
        </div>
      ) : (
        <>
          <div className="hide-scrollbar flex gap-2 overflow-x-auto">
            {["all", "submitted", "approved", "rejected", "not_submitted"].map((k) => (
              <button
                key={k}
                onClick={() => setF(k)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                  f === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {k === "all" ? "All" : LABEL[k]} (
                {k === "all" ? all.length : all.filter((a) => (a.vendorStatus ?? "not_submitted") === k).length})
              </button>
            ))}
          </div>
          {list.length ? (
            <div className="mt-3 space-y-3">
              {list.map((r) => (
                <VendorCard key={r.id} r={r} isAdmin={me?.role === "admin"} />
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">Koi vendor nahi</p>
          )}
        </>
      )}
    </div>
  );
}

function VendorCard({ r, isAdmin }: { r: Account; isAdmin: boolean }) {
  const [open, setOpen] = useState(r.vendorStatus === "submitted");
  const [preview, setPreview] = useState<string | null>(null);
  const st = r.vendorStatus ?? "not_submitted";
  const k = r.vendor;
  return (
    <div className="animate-card-in rounded-2xl bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10">
          <Store className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-extrabold">{k?.shopName || r.name}</p>
          <p className="text-xs text-muted-foreground">
            {k?.ownerName || r.name} • {r.phone}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${BADGE[st]}`}>{LABEL[st]}</span>
      </div>
      {k && (
        <button onClick={() => setOpen(!open)} className="mt-2 text-xs font-bold text-primary underline">
          {open ? "Details chhupaiye" : "Application details dekhiye"}
        </button>
      )}
      {k && open && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {[
              ["Dukaan", k.shopName],
              ["Maalik", k.ownerName],
              ["Mobile", k.phone],
              ["GST", k.gst || "—"],
              ["Bank A/c", k.bankAccount ? "XXXX" + k.bankAccount.slice(-4) : "—"],
              ["IFSC", k.ifsc || "—"],
            ].map(([a, b]) => (
              <p key={a}>
                <span className="text-muted-foreground">{a}: </span>
                <b>{b}</b>
              </p>
            ))}
            <p className="col-span-2">
              <span className="text-muted-foreground">Address: </span>
              {k.address}
            </p>
          </div>
          {k.docs.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {k.docs.map((d) => (
                <button key={d.label} onClick={() => setPreview(d.dataUrl)} className="overflow-hidden rounded-lg border text-left">
                  <img src={d.dataUrl} alt={d.label} className="aspect-[4/3] w-full object-cover" />
                  <p className="truncate px-1 py-0.5 text-[10px] font-bold">{d.label}</p>
                </button>
              ))}
            </div>
          )}
          {k.rejectReason && st === "rejected" && (
            <p className="text-xs text-destructive">Reason: {k.rejectReason}</p>
          )}
          {isAdmin && (st === "submitted" || st === "rejected" || st === "not_submitted") && (
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    await approveVendor(r.id);
                    toast.success(`${k?.shopName || r.name} approved — ab products bech sakta hai`);
                  } catch (e) {
                    toast.error((e as Error).message);
                  }
                }}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-extrabold text-primary-foreground active:scale-95"
              >
                Approve
              </button>
              <button
                onClick={async () => {
                  const reason = window.prompt("Reject karne ka kaaran?", "Document saaf nahi hai");
                  if (!reason) return;
                  try {
                    await rejectVendor(r.id, reason);
                    toast("Application rejected");
                  } catch (e) {
                    toast.error((e as Error).message);
                  }
                }}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-extrabold text-destructive-foreground active:scale-95"
              >
                Reject
              </button>
            </div>
          )}
          {isAdmin && st === "approved" && (
            <button
              onClick={async () => {
                const reason = window.prompt("Vendor ko suspend karne ka kaaran?", "Policy violation");
                if (!reason) return;
                try {
                  await rejectVendor(r.id, reason);
                  toast("Vendor suspended");
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
              className="text-xs font-bold text-destructive underline"
            >
              Suspend kariye
            </button>
          )}
          {st !== "approved" && (
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <IndianRupee className="h-3 w-3" /> Approve hone ke baad hi vendor products add kar payega.
            </p>
          )}
        </div>
      )}
      {preview && (
        <button
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4"
        >
          <img src={preview} alt="Document" className="max-h-full max-w-full rounded-xl" />
        </button>
      )}
    </div>
  );
}
