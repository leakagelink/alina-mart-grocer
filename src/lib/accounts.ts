import { useSyncExternalStore } from "react";

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
  label: string; // Home / Office / Other
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
  password: string;
  createdAt: number;
  addresses?: Address[];
  kycStatus?: KycStatus;
  kyc?: Kyc;
  rejectReason?: string | undefined;
  blocked?: boolean;
};

const KEY = "alina-accounts-v1";
const SESSION = "alina-session";

const SEED: Account[] = [
  { id: "admin1", role: "admin", name: "Admin", phone: "9301499921", password: "Alinamart@123", createdAt: 0 },
  { id: "r1", role: "delivery", name: "Ravi Kumar", phone: "9876543210", password: "ravi123", createdAt: 0, kycStatus: "approved" },
  { id: "r2", role: "delivery", name: "Amit Singh", phone: "9811122233", password: "amit123", createdAt: 0, kycStatus: "approved" },
];

type S = { accounts: Account[]; sessionId: string | null };
let state: S = { accounts: SEED, sessionId: null };
let loaded = false;
const ls = new Set<() => void>();

function save(next: S) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state.accounts));
    if (state.sessionId) localStorage.setItem(SESSION, state.sessionId);
    else localStorage.removeItem(SESSION);
  } catch {
    /* storage full (large docs) */
    throw new Error("Storage full — chhoti photo upload kariye");
  }
  ls.forEach((l) => l());
}

export function hydrateAccounts() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    let accounts = raw ? (JSON.parse(raw) as Account[]) : SEED;
    // Purane saved data me admin/rider seeds missing ho to add karo
    for (const s of SEED) {
      if (!accounts.some((a) => a.phone === s.phone)) accounts = [...accounts, s];
    }
    state = { accounts, sessionId: localStorage.getItem(SESSION) };
    ls.forEach((l) => l());
  } catch {
    /* ignore */
  }
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

export function signUp(input: { role: Role; name: string; phone: string; password: string }) {
  if (state.accounts.some((a) => a.phone === input.phone)) throw new Error("Ye number pehle se registered hai");
  const acc: Account = {
    id: "u" + Date.now(),
    ...input,
    createdAt: Date.now(),
    ...(input.role === "delivery" ? { kycStatus: "not_submitted" as KycStatus } : {}),
  };
  save({ accounts: [...state.accounts, acc], sessionId: acc.id });
  return acc;
}

export function logIn(phone: string, password: string) {
  const a = state.accounts.find((x) => x.phone === phone && x.password === password);
  if (!a) throw new Error("Galat mobile number ya password");
  if (a.blocked) throw new Error("Ye account admin ne block kiya hai");
  save({ ...state, sessionId: a.id });
  return a;
}

export function logOut() {
  save({ ...state, sessionId: null });
}

function patch(id: string, p: Partial<Account>) {
  save({ ...state, accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...p } : a)) });
}

export function submitKyc(id: string, kyc: Kyc) {
  patch(id, { kyc, kycStatus: "submitted", rejectReason: undefined });
}
export function approveKyc(id: string) {
  patch(id, { kycStatus: "approved", rejectReason: undefined });
}
export function rejectKyc(id: string, reason: string) {
  patch(id, { kycStatus: "rejected", rejectReason: reason });
}

export function updateProfile(id: string, p: { name: string }) {
  if (p.name.trim().length < 2) throw new Error("Naam kam se kam 2 characters ka hona chahiye");
  patch(id, { name: p.name.trim().slice(0, 60) });
}

export function changePassword(id: string, oldPw: string, newPw: string) {
  const a = state.accounts.find((x) => x.id === id);
  if (!a) throw new Error("Account nahi mila");
  if (a.password !== oldPw) throw new Error("Purana password galat hai");
  if (newPw.length < 6) throw new Error("Naya password kam se kam 6 characters ka hona chahiye");
  patch(id, { password: newPw });
}

export function saveAddress(id: string, addr: Address) {
  const a = state.accounts.find((x) => x.id === id);
  if (!a) throw new Error("Account nahi mila");
  const list = a.addresses ?? [];
  const isFirst = list.length === 0;
  const next = addr.isDefault || isFirst
    ? [...list.filter((x) => x.id !== addr.id).map((x) => ({ ...x, isDefault: false })), { ...addr, isDefault: true }]
    : [...list.filter((x) => x.id !== addr.id), addr];
  patch(id, { addresses: next });
}

export function deleteAddress(id: string, addrId: string) {
  const a = state.accounts.find((x) => x.id === id);
  if (!a) return;
  const next = (a.addresses ?? []).filter((x) => x.id !== addrId);
  if (next.length > 0 && !next.some((x) => x.isDefault)) next[0] = { ...next[0]!, isDefault: true };
  patch(id, { addresses: next });
}

export function setDefaultAddress(id: string, addrId: string) {
  const a = state.accounts.find((x) => x.id === id);
  if (!a) return;
  patch(id, { addresses: (a.addresses ?? []).map((x) => ({ ...x, isDefault: x.id === addrId })) });
}

export function setBlocked(id: string, blocked: boolean) {
  patch(id, { blocked });
}
export function resetPassword(id: string, pw: string) {
  if (pw.length < 6) throw new Error("Password kam se kam 6 characters");
  patch(id, { password: pw });
}
export function deleteAccount(id: string) {
  save({ accounts: state.accounts.filter((a) => a.id !== id), sessionId: state.sessionId === id ? null : state.sessionId });
}
