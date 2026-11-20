import bannerAsset from "@/assets/martigo-fresh-banner.png.asset.json";
import type { Product } from "@/lib/store";

export type HomeCategory = { id: string; name: string; nameHi: string; group: string; groupHi: string; image: string; productId: string; emoji: string; visible: boolean };
export type HomeBanner = { id: string; title: string; titleHi: string; subtitle: string; subtitleHi: string; image: string; category: string; visible: boolean };
export type HomeSection = { id: string; title: string; titleHi: string; category: string; productIds: string[]; visible: boolean };
export type HomeContent = { categories: HomeCategory[]; banners: HomeBanner[]; sections: HomeSection[] };

export const DEFAULT_HOME: HomeContent = {
  categories: [
    { id: "fruits", name: "Vegetables & Fruits", nameHi: "सब्ज़ियाँ और फल", group: "Grocery & Kitchen", groupHi: "किराना और रसोई", productId: "f2", emoji: "🥬", image: "", visible: true },
    { id: "dairy", name: "Dairy & Eggs", nameHi: "डेयरी और अंडे", group: "Grocery & Kitchen", groupHi: "किराना और रसोई", productId: "d1", emoji: "🥛", image: "", visible: true },
    { id: "bakery", name: "Bakery & Breakfast", nameHi: "बेकरी और नाश्ता", group: "Grocery & Kitchen", groupHi: "किराना और रसोई", productId: "b1", emoji: "🍞", image: "", visible: true },
    { id: "household", name: "Cleaning & Household", nameHi: "सफ़ाई और घरेलू सामान", group: "Grocery & Kitchen", groupHi: "किराना और रसोई", productId: "h1", emoji: "🧴", image: "", visible: true },
    { id: "snacks", name: "Snacks & Munchies", nameHi: "स्नैक्स और नमकीन", group: "Snacks & Drinks", groupHi: "स्नैक्स और पेय", productId: "s1", emoji: "🍪", image: "", visible: true },
    { id: "beverages", name: "Drinks & Juices", nameHi: "पेय और जूस", group: "Snacks & Drinks", groupHi: "स्नैक्स और पेय", productId: "v1", emoji: "🧃", image: "", visible: true },
  ],
  banners: [{ id: "fresh", title: "Fresh finds.\nEvery day.", titleHi: "हर दिन,\nताज़ा सामान।", subtitle: "Your everyday grocery favourites", subtitleHi: "आपके रोज़ के पसंदीदा किराने का सामान", image: bannerAsset.url, category: "fruits", visible: true }],
  sections: [
    { id: "daily", title: "Your daily essentials", titleHi: "आपकी रोज़मर्रा की ज़रूरतें", category: "", productIds: ["d1", "b1", "d2", "f2", "f5", "d3"], visible: true },
    { id: "snacking", title: "Snack time favourites", titleHi: "पसंदीदा स्नैक्स", category: "snacks", productIds: [], visible: true },
    { id: "fresh", title: "Fresh from the farm", titleHi: "खेत से ताज़ा", category: "fruits", productIds: [], visible: true },
  ],
};

export function homeContent(value?: HomeContent): HomeContent {
  return { categories: value?.categories ?? DEFAULT_HOME.categories, banners: value?.banners ?? DEFAULT_HOME.banners, sections: value?.sections ?? DEFAULT_HOME.sections };
}

export function validHomeImage(value: string): boolean {
  if (/^\/__l5e\/assets-v1\/[a-zA-Z0-9/_\-.]+$/.test(value)) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

export function sectionProducts(section: HomeSection, products: Product[]): Product[] {
  if (section.productIds.length) return section.productIds.flatMap(id => products.filter(p => p.id === id));
  return products.filter(p => !section.category || p.category === section.category).slice(0, 12);
}

export function moveItem<T>(items: T[], index: number, direction: number): T[] {
  const next = [...items];
  const target = index + direction;
  if (target < 0 || target >= items.length) return next;
  const a = next[index]; const b = next[target];
  if (a === undefined || b === undefined) return next;
  next[index] = b; next[target] = a;
  return next;
}