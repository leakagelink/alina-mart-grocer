import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { onAuthChanged } from "@/lib/accounts";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  mrp: number;
  unit: string;
  emoji: string;
  image?: string | null;
  stock: number;
};

export type CartItem = { productId: string; qty: number };

export type OrderStatus = "placed" | "packed" | "out_for_delivery" | "delivered" | "cancelled";

export type Order = {
  id: string;
  createdAt: number;
  items: { productId: string; name: string; emoji: string; qty: number; price: number }[];
  total: number;
  payment: "cod" | "online";
  paid: boolean;
  status: OrderStatus;
  customer: { name: string; phone: string; address: string };
  rider: string;
  riderId?: string;
  customerId?: string;
  note?: string;
  photo?: string;
  returnReason?: string;
  discount?: number;
  couponCode?: string;
};

export type CashDeposit = { id: string; rider: string; riderId?: string; amount: number; at: number };
export type Payout = { id: string; rider: string; riderId?: string; amount: number; at: number; status: "pending" | "paid" };

export type Coupon = {
  code: string;
  type: "percent" | "flat" | "freedel";
  value: number; // percent for "percent", rupees for "flat"
  minOrder: number;
  active: boolean;
  used: number;
};

export type AppSettings = {
  deliveryFee: number;
  freeDeliveryAbove: number;
  deliveryMinutes: number;
  codEnabled: boolean;
  onlineEnabled: boolean;
  announcement: string;
};

export type AdminNotification = {
  id: string;
  title: string;
  body: string;
  to: string;
  at: number;
};

export type State = {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  cashDeposits: CashDeposit[];
  payouts: Payout[];
  coupons: Coupon[];
  settings: AppSettings;
  notifications: AdminNotification[];
};

export const CATEGORIES = [
  { id: "fruits", name: "Fruits & Veg", emoji: "🥬" },
  { id: "dairy", name: "Dairy & Eggs", emoji: "🥛" },
  { id: "snacks", name: "Snacks", emoji: "🍪" },
  { id: "bakery", name: "Bakery", emoji: "🍞" },
  { id: "beverages", name: "Beverages", emoji: "🧃" },
  { id: "household", name: "Household", emoji: "🧴" },
];

const p = (
  id: string,
  name: string,
  category: string,
  price: number,
  mrp: number,
  unit: string,
  emoji: string,
  stock: number,
): Product => ({ id, name, category, price, mrp, unit, emoji, stock });

const DEFAULT_PRODUCTS: Product[] = [
  p("f1", "Fresh Tomato", "fruits", 28, 40, "500 g", "🍅", 40),
  p("f2", "Banana Robusta", "fruits", 45, 60, "6 pcs", "🍌", 30),
  p("f3", "Yellow Capsicum", "fruits", 62, 80, "250 g", "🫑", 18),
  p("f4", "Green Lettuce", "fruits", 39, 55, "1 pc", "🥬", 12),
  p("f5", "Onion", "fruits", 32, 45, "1 kg", "🧅", 55),
  p("f6", "Apple Shimla", "fruits", 119, 160, "1 kg", "🍎", 22),
  p("d1", "Amul Toned Milk", "dairy", 27, 30, "500 ml", "🥛", 60),
  p("d2", "Farm Eggs", "dairy", 84, 95, "6 pcs", "🥚", 25),
  p("d3", "Paneer Fresh", "dairy", 89, 110, "200 g", "🧀", 14),
  p("d4", "Curd Cup", "dairy", 35, 40, "400 g", "🍶", 20),
  p("s1", "Potato Chips", "snacks", 20, 25, "52 g", "🥔", 80),
  p("s2", "Choco Cookies", "snacks", 45, 60, "120 g", "🍪", 35),
  p("s3", "Salted Peanuts", "snacks", 55, 70, "200 g", "🥜", 28),
  p("s4", "Instant Noodles", "snacks", 48, 60, "4 pack", "🍜", 44),
  p("b1", "Brown Bread", "bakery", 42, 50, "400 g", "🍞", 16),
  p("b2", "Butter Croissant", "bakery", 60, 75, "2 pcs", "🥐", 10),
  p("b3", "Pav Buns", "bakery", 30, 35, "6 pcs", "🥖", 18),
  p("v1", "Orange Juice", "beverages", 99, 120, "1 L", "🧃", 26),
  p("v2", "Cold Drink", "beverages", 40, 45, "750 ml", "🥤", 50),
  p("v3", "Mineral Water", "beverages", 20, 20, "1 L", "💧", 70),
  p("v4", "Green Tea", "beverages", 149, 190, "25 bags", "🍵", 15),
  p("h1", "Dish Wash Gel", "household", 99, 130, "500 ml", "🧴", 24),
  p("h2", "Floor Cleaner", "household", 185, 220, "1 L", "🧹", 12),
  p("h3", "Toilet Soap", "household", 36, 45, "100 g", "🧼", 40),
];

const CART_KEY = "alina-cart-v2";

export const DEFAULT_SETTINGS: AppSettings = {
  deliveryFee: 25,
  freeDeliveryAbove: 299,
  deliveryMinutes: 15,
  codEnabled: true,
  onlineEnabled: true,
  announcement: "",
};

export const DEFAULT_COUPONS: Coupon[] = [];

let state: State = {
  products: DEFAULT_PRODUCTS,
  cart: [],
  orders: [],
  cashDeposits: [],
  payouts: [],
  coupons: [],
  settings: DEFAULT_SETTINGS,
  notifications: [],
};
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function set(next: State) {
  const cartChanged = next.cart !== state.cart;
  state = next;
  if (cartChanged) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
    } catch {
      /* ignore */
    }
  }
  emit();
}

async function write(p: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await p;
  if (error) {
    toast.error("Save nahi hua: " + error.message);
    loadAll();
  }
}

async function uid() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

let loading: Promise<void> | null = null;
export function loadAll() {
  if (loading) return loading;
  loading = (async () => {
    const [pr, co, se, no, or, le] = await Promise.all([
      supabase.from("products").select("data").order("created_at", { ascending: false }),
      supabase.from("coupons").select("data"),
      supabase.from("app_settings").select("data").eq("id", 1).maybeSingle(),
      supabase.from("notifications").select("data").order("created_at", { ascending: false }),
      supabase.from("orders").select("data, customer_id").order("created_at", { ascending: false }),
      supabase.from("rider_ledger").select("kind, rider_id, data").order("created_at", { ascending: false }),
    ]);
    const ledger = (le.data ?? []) as { kind: string; rider_id: string; data: any }[];
    const products = (pr.data ?? []).map((r: any) => r.data as Product);
    state = {
      ...state,
      products,
      coupons: (co.data ?? []).map((r: any) => r.data as Coupon),
      settings: { ...DEFAULT_SETTINGS, ...((se.data as any)?.data ?? {}) },
      notifications: (no.data ?? []).map((r: any) => r.data as AdminNotification),
      orders: (or.data ?? []).map((r: any) => ({ ...(r.data as Order), customerId: r.customer_id })),
      cashDeposits: ledger.filter((l) => l.kind === "deposit").map((l) => ({ ...l.data, riderId: l.rider_id })),
      payouts: ledger.filter((l) => l.kind === "payout").map((l) => ({ ...l.data, riderId: l.rider_id })),
    };
    emit();
  })().finally(() => {
    loading = null;
  });
  return loading;
}

let started = false;
export function hydrate() {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) state = { ...state, cart: JSON.parse(raw) as CartItem[] };
  } catch {
    /* ignore */
  }
  loadAll();
  let t: ReturnType<typeof setTimeout> | undefined;
  const refresh = () => {
    clearTimeout(t);
    t = setTimeout(() => loadAll(), 300);
  };
  const ch = supabase.channel("store-rt");
  for (const table of ["products", "coupons", "app_settings", "notifications", "orders", "rider_ledger"]) {
    ch.on("postgres_changes", { event: "*", schema: "public", table }, refresh);
  }
  ch.subscribe();
  onAuthChanged(refresh);
}

export function useStore(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}

export const DELIVERY_FEE = 25;
export const FREE_DELIVERY_ABOVE = 299;

export function addToCart(productId: string, qty = 1) {
  const existing = state.cart.find((c) => c.productId === productId);
  const product = state.products.find((x) => x.id === productId);
  if (!product) return;
  const current = existing?.qty ?? 0;
  const nextQty = Math.min(product.stock, current + qty);
  if (nextQty <= 0) {
    set({ ...state, cart: state.cart.filter((c) => c.productId !== productId) });
    return;
  }
  set({
    ...state,
    cart: existing
      ? state.cart.map((c) => (c.productId === productId ? { ...c, qty: nextQty } : c))
      : [...state.cart, { productId, qty: nextQty }],
  });
}

export function removeOne(productId: string) {
  const existing = state.cart.find((c) => c.productId === productId);
  if (!existing) return;
  const qty = existing.qty - 1;
  set({
    ...state,
    cart:
      qty <= 0
        ? state.cart.filter((c) => c.productId !== productId)
        : state.cart.map((c) => (c.productId === productId ? { ...c, qty } : c)),
  });
}

export function clearCart() {
  set({ ...state, cart: [] });
}

export function cartSubtotal(s: State) {
  return s.cart.reduce((sum, c) => {
    const prod = s.products.find((x) => x.id === c.productId);
    return sum + (prod ? prod.price * c.qty : 0);
  }, 0);
}

export function cartCount(s: State) {
  return s.cart.reduce((n, c) => n + c.qty, 0);
}

export type AppliedCoupon = { code: string; discount: number; freeDelivery?: boolean };

export async function placeOrder(input: {
  customer: { name: string; phone: string; address: string };
  payment: "cod" | "online";
  note?: string;
  coupon?: AppliedCoupon;
}): Promise<Order | null> {
  if (state.cart.length === 0) return null;
  const me = await uid();
  if (!me) {
    toast.error("Order ke liye pehle login kariye");
    return null;
  }
  const subtotal = cartSubtotal(state);
  const coupon = input.coupon;
  const fee = deliveryFeeFor(state, subtotal, coupon?.freeDelivery ?? false);
  const discount = coupon?.discount ?? 0;
  const order: Order = {
    id: "AM" + Date.now().toString().slice(-7) + Math.floor(Math.random() * 90 + 10),
    createdAt: Date.now(),
    items: state.cart.flatMap((c) => {
      const prod = state.products.find((x) => x.id === c.productId);
      return prod ? [{ productId: prod.id, name: prod.name, emoji: prod.emoji, qty: c.qty, price: prod.price }] : [];
    }),
    total: Math.max(0, subtotal + fee - discount),
    ...(coupon ? { couponCode: coupon.code, discount } : {}),
    payment: input.payment,
    paid: input.payment === "online",
    status: "placed",
    customer: input.customer,
    rider: "",
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
  };
  const { error } = await supabase.rpc("place_order", { p_order: order as never });
  if (error) {
    toast.error("Order place nahi hua: " + error.message);
    return null;
  }
  set({ ...state, cart: [], orders: [{ ...order, customerId: me }, ...state.orders] });
  loadAll();
  return order;
}

function patchOrder(id: string, fn: (o: Order) => Order) {
  const o = state.orders.find((x) => x.id === id);
  if (!o) return;
  const next = fn(o);
  set({ ...state, orders: state.orders.map((x) => (x.id === id ? next : x)) });
  const { customerId: _c, ...data } = next;
  write(supabase.from("orders").update({ data: data as never }).eq("id", id));
}

export function setOrderStatus(id: string, status: OrderStatus) {
  patchOrder(id, (o) => ({ ...o, status, paid: status === "delivered" ? true : o.paid }));
}

export function assignRider(id: string, rider: string) {
  uid().then((riderId) =>
    patchOrder(id, (o) => ({ ...o, rider, ...(riderId ? { riderId } : {}), status: "out_for_delivery" as OrderStatus })),
  );
}

export function setOrderProof(id: string, photo: string) {
  patchOrder(id, (o) => ({ ...o, photo }));
}

export function returnOrder(id: string, reason: string) {
  patchOrder(id, (o) => ({ ...o, status: "packed" as OrderStatus, returnReason: reason }));
}

export function depositCash(rider: string, amount: number): CashDeposit {
  const d: CashDeposit = { id: "CD" + Date.now().toString().slice(-8), rider, amount, at: Date.now() };
  set({ ...state, cashDeposits: [d, ...state.cashDeposits] });
  uid().then((me) => { if (me) void write(supabase.from("rider_ledger").insert({ id: d.id, kind: "deposit", rider_id: me, data: d as never })); });
  return d;
}

export function requestPayout(rider: string, amount: number): Payout {
  const p: Payout = { id: "PO" + Date.now().toString().slice(-8), rider, amount, at: Date.now(), status: "pending" };
  set({ ...state, payouts: [p, ...state.payouts] });
  uid().then((me) => { if (me) void write(supabase.from("rider_ledger").insert({ id: p.id, kind: "payout", rider_id: me, data: p as never })); });
  return p;
}

export function upsertProduct(product: Product) {
  const exists = state.products.some((x) => x.id === product.id);
  set({
    ...state,
    products: exists
      ? state.products.map((x) => (x.id === product.id ? product : x))
      : [product, ...state.products],
  });
  write(supabase.from("products").upsert({ id: product.id, data: product as never }));
}

export function deleteProduct(id: string) {
  set({ ...state, products: state.products.filter((x) => x.id !== id) });
  write(supabase.from("products").delete().eq("id", id));
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Order Placed",
  packed: "Packed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const inr = (n: number) => "₹" + n.toFixed(0);

// ---------- App settings ----------
export function deliveryFeeFor(s: State, subtotal: number, freeDelivery = false): number {
  if (subtotal === 0 || freeDelivery) return 0;
  return subtotal >= s.settings.freeDeliveryAbove ? 0 : s.settings.deliveryFee;
}

export function updateSettings(patch: Partial<AppSettings>) {
  const settings = { ...state.settings, ...patch };
  set({ ...state, settings });
  write(supabase.from("app_settings").upsert({ id: 1, data: settings as never }));
}

// ---------- Coupons ----------
export function validateCoupon(
  codeRaw: string,
  subtotal: number,
): { ok: boolean; discount: number; freeDelivery?: boolean; code?: string; message: string } {
  const code = codeRaw.trim().toUpperCase();
  const c = state.coupons.find((x) => x.code === code);
  if (!c) return { ok: false, discount: 0, message: "Coupon code galat hai" };
  if (!c.active) return { ok: false, discount: 0, message: "Ye coupon abhi active nahi hai" };
  if (subtotal < c.minOrder)
    return { ok: false, discount: 0, message: `Minimum order ${inr(c.minOrder)} chahiye` };
  if (c.type === "percent") {
    const d = Math.min(Math.round((subtotal * c.value) / 100), subtotal);
    return { ok: true, discount: d, code: c.code, message: `${c.value}% off — ${inr(d)} bachat!` };
  }
  if (c.type === "flat") {
    const d = Math.min(c.value, subtotal);
    return { ok: true, discount: d, code: c.code, message: `${inr(d)} off applied!` };
  }
  return { ok: true, discount: 0, freeDelivery: true, code: c.code, message: "Free delivery applied!" };
}

export function upsertCoupon(coupon: Coupon) {
  const exists = state.coupons.some((c) => c.code === coupon.code);
  set({
    ...state,
    coupons: exists
      ? state.coupons.map((c) => (c.code === coupon.code ? coupon : c))
      : [coupon, ...state.coupons],
  });
  write(supabase.from("coupons").upsert({ code: coupon.code, data: coupon as never }));
}

export function deleteCoupon(code: string) {
  set({ ...state, coupons: state.coupons.filter((c) => c.code !== code) });
  write(supabase.from("coupons").delete().eq("code", code));
}

export function toggleCoupon(code: string) {
  const c = state.coupons.find((x) => x.code === code);
  if (c) upsertCoupon({ ...c, active: !c.active });
}

// ---------- Notifications ----------
export function sendNotification(title: string, body: string, to = "all"): AdminNotification {
  const n: AdminNotification = {
    id: "NT" + Date.now().toString().slice(-8),
    title,
    body,
    to,
    at: Date.now(),
  };
  set({ ...state, notifications: [n, ...state.notifications] });
  write(supabase.from("notifications").insert({ id: n.id, data: n as never }));
  return n;
}

export function deleteNotification(id: string) {
  set({ ...state, notifications: state.notifications.filter((n) => n.id !== id) });
  write(supabase.from("notifications").delete().eq("id", id));
}
