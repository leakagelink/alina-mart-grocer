import { useSyncExternalStore } from "react";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  mrp: number;
  unit: string;
  emoji: string;
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
};

export type State = {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
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

const KEY = "alina-mart-v1";

let state: State = { products: DEFAULT_PRODUCTS, cart: [], orders: [] };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function set(next: State) {
  state = next;
  persist();
  emit();
}

export function hydrate() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as State;
    if (parsed?.products?.length) {
      state = { products: parsed.products, cart: parsed.cart ?? [], orders: parsed.orders ?? [] };
      emit();
    }
  } catch {
    /* ignore */
  }
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

export function placeOrder(input: {
  customer: { name: string; phone: string; address: string };
  payment: "cod" | "online";
}): Order | null {
  if (state.cart.length === 0) return null;
  const subtotal = cartSubtotal(state);
  const fee = subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  const order: Order = {
    id: "AM" + Date.now().toString().slice(-8),
    createdAt: Date.now(),
    items: state.cart.map((c) => {
      const prod = state.products.find((x) => x.id === c.productId)!;
      return { productId: prod.id, name: prod.name, emoji: prod.emoji, qty: c.qty, price: prod.price };
    }),
    total: subtotal + fee,
    payment: input.payment,
    paid: input.payment === "online",
    status: "placed",
    customer: input.customer,
    rider: "Ravi Kumar",
  };
  const products = state.products.map((prod) => {
    const line = state.cart.find((c) => c.productId === prod.id);
    return line ? { ...prod, stock: Math.max(0, prod.stock - line.qty) } : prod;
  });
  set({ products, cart: [], orders: [order, ...state.orders] });
  return order;
}

export function setOrderStatus(id: string, status: OrderStatus) {
  set({
    ...state,
    orders: state.orders.map((o) =>
      o.id === id ? { ...o, status, paid: status === "delivered" ? true : o.paid } : o,
    ),
  });
}

export function upsertProduct(product: Product) {
  const exists = state.products.some((x) => x.id === product.id);
  set({
    ...state,
    products: exists
      ? state.products.map((x) => (x.id === product.id ? product : x))
      : [product, ...state.products],
  });
}

export function deleteProduct(id: string) {
  set({ ...state, products: state.products.filter((x) => x.id !== id) });
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Order Placed",
  packed: "Packed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const inr = (n: number) => "₹" + n.toFixed(0);
