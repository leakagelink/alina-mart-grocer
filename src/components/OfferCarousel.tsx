import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import type { HomeBanner } from "@/lib/home-content";
import { OFFER_INTERVAL_MS, nextOffer } from "@/lib/offer-carousel";

export function OfferCarousel({ banners, onSelect }: { banners: HomeBanner[]; onSelect: (category: string) => void }) {
  const [ref, api] = useEmblaCarousel({ loop: true });
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reduced, setReduced] = useState(false);
  const { lang, t } = useLang();
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync(); media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!api) return;
    const sync = () => setActive(api.selectedScrollSnap());
    sync(); api.on("select", sync); api.on("reInit", sync);
    return () => { api.off("select", sync); api.off("reInit", sync); };
  }, [api]);
  useEffect(() => {
    if (!api || banners.length < 2 || paused || interacting || reduced) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) api.scrollTo(nextOffer(api.selectedScrollSnap(), banners.length));
    }, OFFER_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [api, banners.length, paused, interacting, reduced]);
  if (!banners.length) return null;
  return <section aria-label="Offers" aria-roledescription="carousel" onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocusCapture={() => setInteracting(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setInteracting(false); }}>
    <div ref={ref} className="overflow-hidden rounded-lg">
      <div className="flex touch-pan-y">
        {banners.map((b, index) => <div key={b.id} role="group" aria-label={`${index + 1} / ${banners.length}`} aria-roledescription="slide" className="min-w-0 flex-[0_0_100%]">
          <Button variant="ghost" tabIndex={active === index ? 0 : -1} onClick={() => onSelect(b.category)} className="group relative block h-44 w-full overflow-hidden rounded-lg p-0 text-left sm:h-64">
            <img src={b.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span className="home-banner-copy absolute inset-y-0 left-0 flex w-1/2 flex-col justify-center px-4 sm:px-8"><span className="whitespace-pre-line text-xl font-extrabold leading-tight sm:text-3xl">{lang === "hi" ? b.titleHi || b.title : b.title}</span><span className="mt-2 whitespace-normal text-xs sm:text-sm">{lang === "hi" ? b.subtitleHi || b.subtitle : b.subtitle}</span><span className="mt-3 flex items-center gap-1 text-xs font-bold">{t("shopNow")}<ChevronRight /></span></span>
          </Button>
        </div>)}
      </div>
    </div>
    {banners.length > 1 && <div className="mt-2 flex items-center justify-between gap-2">
      <Button variant="ghost" size="icon" aria-label="Previous offer" onClick={() => api?.scrollPrev()} className="h-7 w-7"><ChevronLeft /></Button>
      <div className="flex gap-1">{banners.map((b, i) => <Button key={b.id} variant="ghost" size="icon" aria-label={`Offer ${i + 1}`} aria-pressed={active === i} onClick={() => api?.scrollTo(i)} className="h-7 w-7"><span className={`h-1.5 rounded-full transition-all ${active === i ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/40"}`} /></Button>)}</div>
      <div className="flex"><Button variant="ghost" size="icon" aria-label={paused ? "Play offers" : "Pause offers"} onClick={() => setPaused(!paused)} className="h-7 w-7">{paused ? <Play /> : <Pause />}</Button><Button variant="ghost" size="icon" aria-label="Next offer" onClick={() => api?.scrollNext()} className="h-7 w-7"><ChevronRight /></Button></div>
    </div>}
  </section>;
}