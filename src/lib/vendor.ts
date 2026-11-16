import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { onAuthChanged } from "@/lib/accounts";

export type VendorOrderItem = {
  productId: string;
  name: string;
  emoji: string;
  qty: number;
  price: number;
};

export type VendorOrderRow = {
  orderId: string;
  vendorId: string;
  shopName: string;
  amount: number;
  items: VendorOrderItem[];
  status: string;
  payment: string;
  paid: boolean;
  customer: { name?: string; phone?: string; address?: string };
  note: string;
  orderTotal: number;
  placedAt: string;
};

export type VendorPayout = {
  id: string;
  amount: number;
  at: number;
  status: "pending" | "paid";
  vendorId?: string;
};

type S = { rows: VendorOrderRow[]; payouts: VendorPayout[]; ready: boolean };

let state: S = { rows: [], payouts: [], ready: false };
let started = false;
let loading: Promise<void> | null = null;
const ls = new Set<() => void>();

function emit() {
  ls.forEach((l) => l());
}

function set(next: S) {
  state = next;
  emit();
}

async function loadAll() {
  if (loading) return loading;
  loading = (async () => {
    const [rows, led] = await Promise.all([
      supabase.from("order_vendors").select("data, vendor_id").order("created_at", { ascending: false }).limit(300),
      supabase.from("vendor_ledger").select("data, vendor_id").eq("kind", "payout").order("created_at", { ascending: false }).limit(300),
    ]);
    set({
      rows: (rows.data ?? []).map((r: any) => r.data as VendorOrderRow),
      payouts: (led.data ?? []).map((r: any) => ({ ...(r.data as VendorPayout), vendorId: r.vendor_id as string })),
      ready: true,
    });
  })().finally(() => {
    loading = null;
  });
  return loading;
}

export function reloadVendor() {
  return loadAll();
}

export function hydrateVendor() {
  if (started || typeof window === "undefined") return;
  started = true;
  loadAll();
  let t: ReturnType<typeof setTimeout> | undefined;
  const refresh = () => {
    clearTimeout(t);
    t = setTimeout(() => loadAll(), 300);
  };
  const ch = supabase.channel("vendor-rt");
  for (const table of ["order_vendors", "vendor_ledger"]) {
    ch.on("postgres_changes", { event: "*", schema: "public", table }, refresh);
  }
  ch.subscribe();
  onAuthChanged(refresh);
}

export function useVendorStore(): S {
  return useSyncExternalStore(
    (cb) => {
      ls.add(cb);
      return () => ls.delete(cb);
    },
    () => state,
    () => state,
  );
}

/** Money a vendor has actually earned — only delivered orders count. */
export function vendorEarnings(rows: VendorOrderRow[]) {
  return rows.filter((r) => r.status === "delivered").reduce((s, r) => s + r.amount, 0);
}

export function vendorPayoutTotals(payouts: VendorPayout[]) {
  const pending = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const paid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  return { pending, paid };
}

export function vendorAvailable(rows: VendorOrderRow[], payouts: VendorPayout[]) {
  const earned = vendorEarnings(rows);
  const { pending, paid } = vendorPayoutTotals(payouts);
  return Math.max(0, earned - pending - paid);
}

export async function requestVendorPayout(vendorId: string, amount: number): Promise<VendorPayout> {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Sahi amount daaliye");
  const p: VendorPayout = {
    id: "VP" + Date.now().toString().slice(-8),
    amount: Math.round(amount),
    at: Date.now(),
    status: "pending",
    vendorId,
  };
  const { error } = await supabase
    .from("vendor_ledger")
    .insert({ id: p.id, kind: "payout", vendor_id: vendorId, data: p as never });
  if (error) throw new Error(error.message);
  await loadAll();
  return p;
}

export async function markVendorPayoutPaid(p: VendorPayout) {
  const next: VendorPayout = { ...p, status: "paid" };
  const { error } = await supabase.from("vendor_ledger").update({ data: next as never }).eq("id", p.id);
  if (error) throw new Error(error.message);
  await loadAll();
}
