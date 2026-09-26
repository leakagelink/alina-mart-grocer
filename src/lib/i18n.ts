import { useSyncExternalStore } from "react";

export type Lang = "en" | "hi";
const KEY = "alina-lang";
let lang: Lang = "en";
const subs = new Set<() => void>();

if (typeof window !== "undefined") {
  const s = window.localStorage.getItem(KEY);
  if (s === "hi" || s === "en") lang = s;
}

export function setLang(l: Lang) {
  lang = l;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, l);
    document.documentElement.lang = l;
  }
  subs.forEach((f) => f());
}

const dict = {
  home: { en: "Home", hi: "होम" },
  cart: { en: "Cart", hi: "कार्ट" },
  orders: { en: "Orders", hi: "ऑर्डर" },
  admin: { en: "Admin", hi: "एडमिन" },
  deliveryIn: { en: "Delivery in 15 min • Indore, MP 452001", hi: "15 मिनट में डिलीवरी • इंदौर, MP 452001" },
  search: { en: "Search for milk, bread, atta…", hi: "दूध, ब्रेड, आटा खोजें…" },
  superfast: { en: "Superfast delivery", hi: "सुपरफास्ट डिलीवरी" },
  heroSub: { en: "Groceries • Daily Essentials • More — at your door in 15 minutes", hi: "किराना • रोज़मर्रा का सामान • और भी — 15 मिनट में आपके दरवाज़े पर" },
  min15: { en: "15 min", hi: "15 मिनट" },
  shopByCat: { en: "Shop by category", hi: "कैटेगरी से खरीदें" },
  all: { en: "All", hi: "सभी" },
  allProducts: { en: "All products", hi: "सभी प्रोडक्ट" },
  noProducts: { en: "No products found. Try another name.", hi: "कोई प्रोडक्ट नहीं मिला। दूसरा नाम आज़माएँ।" },
  items: { en: "items", hi: "आइटम" },
  viewCart: { en: "View cart →", hi: "कार्ट देखें →" },
  off: { en: "OFF", hi: "छूट" },
  outOfStock: { en: "Out of stock", hi: "स्टॉक खत्म" },
  add: { en: "ADD", hi: "जोड़ें" },
  yourCart: { en: "Your cart", hi: "आपका कार्ट" },
  clear: { en: "Clear", hi: "खाली करें" },
  cartEmpty: { en: "Your cart is empty.", hi: "कार्ट खाली है।" },
  startShopping: { en: "Start shopping", hi: "खरीदारी शुरू करें" },
  itemTotal: { en: "Item total", hi: "आइटम कुल" },
  deliveryFee: { en: "Delivery fee", hi: "डिलीवरी शुल्क" },
  free: { en: "FREE", hi: "मुफ़्त" },
  addMoreFree: { en: "more for free delivery!", hi: "और जोड़ें — डिलीवरी मुफ़्त!" },
  toPay: { en: "To pay", hi: "कुल भुगतान" },
  proceed: { en: "Proceed to checkout", hi: "चेकआउट करें" },
  "cat.fruits": { en: "Fruits & Veg", hi: "फल और सब्ज़ी" },
  "cat.dairy": { en: "Dairy & Eggs", hi: "डेयरी और अंडे" },
  "cat.snacks": { en: "Snacks", hi: "स्नैक्स" },
  "cat.bakery": { en: "Bakery", hi: "बेकरी" },
  "cat.beverages": { en: "Beverages", hi: "पेय पदार्थ" },
  "cat.household": { en: "Household", hi: "घरेलू सामान" },
  bestsellers: { en: "Bestsellers", hi: "सबसे ज़्यादा बिकने वाले" },
  topDeals: { en: "Today's top deals", hi: "आज के टॉप ऑफ़र" },
  viewAll: { en: "View all", hi: "सभी देखें" },
  b1t: { en: "Fresh veggies, daily", hi: "ताज़ी सब्ज़ियाँ, रोज़" },
  b1b: { en: "Farm-fresh produce at mandi prices", hi: "मंडी भाव पर ताज़ा सामान" },
  b2t: { en: "Free delivery", hi: "मुफ़्त डिलीवरी" },
  b3t: { en: "Dairy & breakfast", hi: "डेयरी और नाश्ता" },
  b3b: { en: "Milk, bread, eggs — before your chai", hi: "दूध, ब्रेड, अंडे — चाय से पहले" },
  whyFresh: { en: "100% fresh guarantee", hi: "100% ताज़गी की गारंटी" },
  whyFast: { en: "15-minute delivery", hi: "15 मिनट में डिलीवरी" },
  whyPrice: { en: "Best prices daily", hi: "रोज़ सबसे अच्छे दाम" },
  shopNow: { en: "Shop now", hi: "अभी खरीदें" },
} satisfies Record<string, Record<Lang, string>>;

export type TKey = keyof typeof dict;

export function useLang() {
  const l = useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    () => lang,
    () => "en" as Lang,
  );
  const t = (k: TKey) => dict[k][l];
  const tc = (id: string, fallback: string) =>
    (dict as Record<string, Record<Lang, string>>)[`cat.${id}`]?.[l] ?? fallback;
  return { lang: l, t, tc, setLang };
}
