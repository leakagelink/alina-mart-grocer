import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminDeleteUser, adminResetPassword } from "@/lib/admin-users.functions";

export type Role = "customer" | "delivery" | "admin";
export type KycStatus = "not_submitted" | "submitted" | "approved" | "rejected";
export type KycDoc = { label: string; fileName: string; dataUrl: string };
export type Kyc = {
  fullName: string;
  dob: string;
  address: string;
  aadhaar: string;
  pan: string;
  dlNumber: string;
  vehicleType: string;
  vehicleNumber: string;
  bankAccount: string;
  ifsc: string;
  docs: KycDoc[];
  submittedAt: number;
};
export type Address = {
  id: string;
  label: string;
  line: string;
  landmark?: string;
  pincode: string;
  isDefault?: boolean;
};
export type Account = {
  id: string;
  role: Role;
  name: string;
  phone: string;
  createdAt: number;
  addresses?: Address[];
  kycStatus?: KycStatus;
  kyc?: Kyc;
  rejectReason?: string | undefined;
  blocked?: boolean;
};

type S = { accounts: Account[]; sessionId: string | null; ready: boolean };
let state: S = { accounts: [], sessionId: null, ready: false };
let started = false;
const ls = new Set<() => void>();
const authListeners = new Set<() => void>();

function setState(next: S) {
  state = next;
  ls.forEach((l) => l());
}

export function onAuthChanged(fn: () => void) {
  authListeners.add(fn);
  return () => authListeners.delete(fn);
}

const emailFor = (phone: string) => `${phone}@alinamart.app`;

async function loadAccounts(sessionId: string | null) {
  if (!sessionId) {
    setState({ accounts: [], sessionId: null, ready: true });
    return;
  }
  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  const roleOf = (id: string): Role => {
    const r = (roles ?? []).filter((x) => x.user_id === id).map((x) => x.role as Role);
    return r.includes("admin") ? "admin" : r.includes("delivery") ? "delivery" : "customer";
  };
  const accounts: Account[] = (profiles ?? []).map((p: any) => ({
    id: p.id,
    role: roleOf(p.id),
    name: p.name,
    phone: p.phone,
    createdAt: new Date(p.created_at).getTime(),
    addresses: (p.addresses ?? []) as Address[],
    kycStatus: (p.kyc_status ?? undefined) as KycStatus | undefined,
    kyc: (p.kyc ?? undefined) as Kyc | undefined,
    rejectReason: p.reject_reason ?? undefined,
    blocked: p.blocked,
  })) as Account[];
  setState({ accounts, sessionId, ready: true });
}

export function reloadAccounts() {
  return loadAccounts(state.sessionId);
}

export function hydrateAccounts() {
  if (started || typeof window === "undefined") return;
  started = true;
  supabase.auth.getSession().then(({ data }) => loadAccounts(data.session?.user.id ?? null));
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED") return;
    const id = session?.user.id ?? null;
    if (id === state.sessionId && event === "INITIAL_SESSION") return;
    setTimeout(() => {
      loadAccounts(id);
      authListeners.forEach((f) => f());
    }, 0);
  });
  supabase
    .channel("profiles-rt")
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
      if (state.sessionId) loadAccounts(state.sessionId);
    })
    .subscribe();
}

export function useAccounts() {
  return useSyncExternalStore(
    (cb) => {
      ls.add(cb);
      return () => ls.delete(cb);
    },
    () => state,
    () => state,
  );
}

export function currentAccount(s: S) {
  return s.accounts.find((a) => a.id === s.sessionId) ?? null;
}

function msg(e: { message: string }) {
  const m = e.message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) return "Ye number pehle se registered hai";
  if (m.includes("invalid login")) return "Galat mobile number ya password";
  return e.message;
}

export async function signUp(input: { role: Role; name: string; phone: string; password: string }) {
  if (input.role === "admin") throw new Error("Not allowed");
  const { data, error } = await supabase.auth.signUp({
    email: emailFor(input.phone),
    password: input.password,
    options: { data: { name: input.name, phone: input.phone, role: input.role } },
  });
  if (error) throw new Error(msg(error));
  if (!data.session) throw new Error("Account ban gaya, ab login kariye");
  await loadAccounts(data.session.user.id);
  return currentAccount(state)!;
}

export async function logIn(phone: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: emailFor(phone), password });
  if (error) throw new Error(msg(error));
  await loadAccounts(data.user.id);
  const a = currentAccount(state);
  if (!a) throw new Error("Account nahi mila");
  if (a.blocked) {
    await supabase.auth.signOut();
    throw new Error("Ye account admin ne block kiya hai");
  }
  return a;
}

export async function logOut() {
  await supabase.auth.signOut();
  setState({ accounts: [], sessionId: null, ready: true });
}

async function patch(id: string, p: Record<string, unknown>) {
  const { error } = await supabase.from("profiles").update(p as never).eq("id", id);
  if (error) throw new Error(error.message);
  await loadAccounts(state.sessionId);
}

export function submitKyc(id: string, kyc: Kyc) {
  return patch(id, { kyc, kyc_status: "submitted" });
}
export function approveKyc(id: string) {
  return patch(id, { kyc_status: "approved", reject_reason: null });
}
export function rejectKyc(id: string, reason: string) {
  return patch(id, { kyc_status: "rejected", reject_reason: reason });
}

export function updateProfile(id: string, p: { name: string }) {
  if (p.name.trim().length < 2) throw new Error("Naam kam se kam 2 characters ka hona chahiye");
  return patch(id, { name: p.name.trim().slice(0, 60) });
}

export async function changePassword(id: string, oldPw: string, newPw: string) {
  const a = state.accounts.find((x) => x.id === id);
  if (!a) throw new Error("Account nahi mila");
  if (newPw.length < 6) throw new Error("Naya password kam se kam 6 characters ka hona chahiye");
  const { error: e1 } = await supabase.auth.signInWithPassword({ email: emailFor(a.phone), password: oldPw });
  if (e1) throw new Error("Purana password galat hai");
  const { error } = await supabase.auth.updateUser({ password: newPw, current_password: oldPw } as never);
  if (error) throw new Error(error.message);
}

function addrs(id: string) {
  const a = state.accounts.find((x) => x.id === id);
  if (!a) throw new Error("Account nahi mila");
  return a.addresses ?? [];
}

export function saveAddress(id: string, addr: Address) {
  const list = addrs(id);
  const isFirst = list.length === 0;
  const next =
    addr.isDefault || isFirst
      ? [...list.filter((x) => x.id !== addr.id).map((x) => ({ ...x, isDefault: false })), { ...addr, isDefault: true }]
      : [...list.filter((x) => x.id !== addr.id), addr];
  return patch(id, { addresses: next });
}

export function deleteAddress(id: string, addrId: string) {
  const next = addrs(id).filter((x) => x.id !== addrId);
  if (next.length > 0 && !next.some((x) => x.isDefault)) next[0] = { ...next[0]!, isDefault: true };
  return patch(id, { addresses: next });
}

export function setDefaultAddress(id: string, addrId: string) {
  return patch(id, { addresses: addrs(id).map((x) => ({ ...x, isDefault: x.id === addrId })) });
}

export function setBlocked(id: string, blocked: boolean) {
  return patch(id, { blocked });
}
export async function resetPassword(id: string, pw: string) {
  if (pw.length < 6) throw new Error("Password kam se kam 6 characters");
  await adminResetPassword({ data: { id, password: pw } });
}
export async function deleteAccount(id: string) {
  await adminDeleteUser({ data: { id } });
  await loadAccounts(state.sessionId);
}
