import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, Search, ShoppingBag, User, LayoutGrid, Clock3, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLang } from "@/lib/i18n";
import { homeContent, sectionProducts } from "@/lib/home-content";
import { currentAccount, hydrateAccounts, useAccounts } from "@/lib/accounts";
import { cartCount, cartSubtotal, hydrate, inr, useStore } from "@/lib/store";
import logo from "@/assets/martigo-icon.png.asset.json";
import { OfferCarousel } from "@/components/OfferCarousel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Martigo — Groceries & Daily Essentials in 15 Minutes" },
      {
        name: "description",
        content:
          "Order fruits, vegetables, dairy, snacks and household essentials from Martigo with 15-minute delivery, COD or online payment, and live order tracking.",
      },
      { property: "og:title", content: "Martigo — Groceries in 15 Minutes" },
      {
        property: "og:description",
        content: "Fresh groceries and daily essentials delivered fast. COD & online payment.",
      },

      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const state = useStore();
  const me = currentAccount(useAccounts());
  const { t, lang } = useLang();
  const home = homeContent(state.settings.home);
  const categories = home.categories.filter(c => c.visible);
  const local = (en: string, hi: string) => lang === "hi" ? hi || en : en;
  useEffect(() => { hydrate(); hydrateAccounts(); }, []);
  const products = useMemo(() => state.products.filter(p => (!cat || p.category === cat) && (!query.trim() || p.name.toLowerCase().includes(query.trim().toLowerCase()))), [state.products, cat, query]);
  const searching = !!query.trim() || cat !== null;
  const count = cartCount(state);
  const address = me?.addresses?.find(a => a.isDefault) ?? me?.addresses?.[0];
  const groups = [...new Set(categories.map(c => c.group))];
  return <div className="martigo-home min-h-screen bg-card text-foreground">
    <header className="home-header sticky top-0 z-30 border-b">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><div className="flex items-center gap-2"><img src={logo.url} alt="" className="h-7 w-7" /><h1 className="text-lg font-extrabold">Martigo</h1><span className="hidden text-xs text-muted-foreground sm:inline">{t("superfast")}</span></div>
            <div className="mt-1 text-[28px] font-extrabold leading-tight sm:text-3xl">{state.settings.deliveryMinutes} {local("minutes", "मिनट")}</div>
            <Link to="/signup" className="mt-1 flex max-w-full items-center gap-1 text-sm"><span className="font-extrabold">{address?.label ?? local("HOME", "घर")}</span><span className="truncate">– {address?.line ?? local("Select delivery address", "डिलीवरी पता चुनें")}</span><ChevronDown className="h-4 w-4 shrink-0" /></Link>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-2"><LanguageToggle /><Button asChild variant="outline" size="icon" className="h-11 w-11 rounded-full border-0 bg-card" aria-label="Account"><Link to="/signup"><User /></Link></Button></div>
        </div>
        <div className="mt-4 flex h-12 items-center gap-3 rounded-lg border bg-card px-3 shadow-sm"><Search className="h-5 w-5 shrink-0" /><input aria-label="Search products" value={query} onChange={e => setQuery(e.target.value)} placeholder={t("search")} className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm outline-none" />{query && <Button variant="ghost" size="icon" aria-label="Clear search" onClick={() => setQuery("")}><X /></Button>}</div>
        <div className="hide-scrollbar mt-3 flex gap-5 overflow-x-auto sm:gap-8"><Button variant="ghost" onClick={() => { setCat(null); setQuery(""); }} className={`h-16 shrink-0 flex-col gap-1 rounded-none border-b-4 px-2 text-xs ${cat === null ? "border-primary text-primary" : "border-transparent"}`}><LayoutGrid className="!h-6 !w-6" />{t("all")}</Button>{categories.map(c => <Button key={c.id} variant="ghost" onClick={() => setCat(c.id)} className={`h-16 shrink-0 flex-col gap-1 rounded-none border-b-4 px-1 text-xs ${cat === c.id ? "border-primary text-primary" : "border-transparent"}`}><span className="grid h-7 w-9 place-items-center">{(() => { const p = state.products.find(p => p.id === c.productId) ?? state.products.find(p => p.category === c.id); return c.image ? <img src={c.image} alt="" className="h-full w-full object-contain" /> : p ? <ProductImage product={p} /> : <span className="text-2xl">{c.emoji}</span>; })()}</span><span>{local(c.name,c.nameHi).split(" & ")[0]}</span></Button>)}</div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl space-y-8 px-3 pb-44 pt-4 sm:px-6 sm:pt-6">
      {state.settings.announcement && <div className="border-b pb-3 text-sm font-semibold text-primary">{state.settings.announcement}</div>}
      {!searching && <>
        <OfferCarousel banners={home.banners.filter(b => b.visible)} onSelect={category => setCat(category || null)} />
        <section className="home-section"><h2 className="mb-3 text-lg font-extrabold sm:text-2xl">{local("Frequently bought", "अक्सर खरीदा जाता है")}</h2><div className="home-strip hide-scrollbar flex gap-3 overflow-x-auto">{categories.slice(0,4).map(c => { const product = state.products.find(p => p.id === c.productId) ?? state.products.find(p => p.category === c.id); return <Button key={c.id} variant="ghost" onClick={() => setCat(c.id)} className="home-frequent flex h-28 w-36 shrink-0 flex-col rounded-lg px-3 py-2 sm:w-44"><span className="h-16 w-24">{product && <ProductImage product={product} />}</span><span className="text-xs font-bold">{local(c.name,c.nameHi)}</span></Button>; })}</div><Button variant="ghost" className="mt-3 h-11 w-full bg-accent text-primary" onClick={() => { setCat(null); document.getElementById("all-products")?.scrollIntoView({behavior:"smooth"}); }}>{t("allProducts")}<ChevronRight /></Button></section>
        {groups.map(group => { const list = categories.filter(c => c.group === group); return <section className="home-section" key={group}><h2 className="mb-4 text-lg font-extrabold sm:text-2xl">{local(group,list[0]?.groupHi ?? group)}</h2><div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-6 sm:gap-5">{list.map(c => { const product = state.products.find(p => p.id === c.productId) ?? state.products.find(p => p.category === c.id); return <Button key={c.id} variant="ghost" onClick={() => setCat(c.id)} className="home-category flex h-auto min-w-0 flex-col justify-start gap-2 whitespace-normal p-0 hover:bg-transparent"><span className="home-category-image grid aspect-square w-full place-items-center overflow-hidden rounded-lg p-2">{c.image ? <img src={c.image} alt={c.name} className="h-full w-full object-contain" /> : product ? <ProductImage product={product} /> : <span className="text-3xl">{c.emoji}</span>}</span><span className="min-h-9 text-center text-[11px] font-semibold leading-tight sm:text-sm">{local(c.name,c.nameHi)}</span></Button>; })}</div></section>; })}
        {home.sections.filter(s => s.visible).map(section => { const items = sectionProducts(section,state.products); return items.length ? <section className="home-section" key={section.id}><div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-lg font-extrabold sm:text-2xl">{local(section.title,section.titleHi)}</h2>{section.category && <Button variant="link" size="sm" onClick={() => setCat(section.category)}>{t("viewAll")}<ChevronRight /></Button>}</div><div className="home-strip hide-scrollbar flex gap-3 overflow-x-auto pb-1">{items.map(p => <div key={p.id} className="w-[148px] shrink-0 sm:w-[188px]"><ProductCard product={p} compact /></div>)}</div></section> : null; })}
      </>}
      <section id="all-products"><div className="mb-4 flex items-center gap-2">{searching && <Button variant="ghost" size="icon" aria-label="Back to home" onClick={() => {setCat(null);setQuery("");}}><ArrowLeft /></Button>}<h2 className="text-lg font-extrabold sm:text-2xl">{cat ? local(categories.find(c=>c.id===cat)?.name ?? cat,categories.find(c=>c.id===cat)?.nameHi ?? cat) : t("allProducts")}</h2></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{products.map(p => <ProductCard key={p.id} product={p} compact />)}</div>{!products.length && <p className="py-10 text-center text-muted-foreground">{t("noProducts")}</p>}</section>
      <div className="flex items-center justify-center gap-2 border-t pt-6 text-xs text-muted-foreground"><Clock3 className="h-4 w-4" />{state.settings.deliveryMinutes} {local("minute delivery", "मिनट में डिलीवरी")} · Martigo</div>
    </main>
    {count > 0 && <Button asChild className="cart-dock fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-1/2 z-40 h-14 w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 justify-between rounded-lg px-4 shadow-lift"><Link to="/cart"><span className="flex items-center gap-3"><ShoppingBag className="!h-7 !w-7"/><span className="flex flex-col items-start"><span className="text-base font-bold">{t("viewCart").replace(" →", "")}</span><span className="text-xs opacity-80">{count} {t("items")} · {inr(cartSubtotal(state))}</span></span></span><ChevronRight className="!h-6 !w-6" /></Link></Button>}
    <BottomNav />
  </div>;
}
