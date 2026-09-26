import { useSyncExternalStore } from "react";

export type Role = "customer" | "delivery";
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
export type Account = {
  id: string;
  role: Role;
  name: string;
  phone: string;
  password: string;
  createdAt: number;
  kycStatus?: KycStatus;
  kyc?: Kyc;
  rejectReason?: string | undefined;
};

const KEY = "alina-accounts-v1";
const SESSION = "alina-session";

const SEED: Account[] = [
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
    const accounts = raw ? (JSON.parse(raw) as Account[]) : SEED;
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
