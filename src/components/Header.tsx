import { Link } from "@tanstack/react-router";
import { MapPin, ShoppingCart, LayoutDashboard, User } from "lucide-react";
import logo from "@/assets/martigo-icon.png.asset.json";
import { cartCount, useStore } from "@/lib/store";
import { currentAccount, hydrateAccounts, useAccounts } from "@/lib/accounts";
import { useEffect } from "react";
import { useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { NotificationBell } from "@/components/NotificationBell";

export function Header({ query, onQuery }: { query?: string; onQuery?: (v: string) => void }) {
  const state = useStore();
  const accState = useAccounts();
  const me = currentAccount(accState);
  const count = cartCount(state);
  const { t } = useLang();

  useEffect(() => { hydrateAccounts(); }, []);

  return (
    <header className="sticky top-0 z-30 border-b bg-card text-foreground">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
        <BackButton />
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img
            src={logo.url}
            alt="Martigo"
            className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
          />
          <span className="truncate text-base font-extrabold leading-none sm:text-lg">
            Marti<span className="text-secondary">go</span>
          </span>
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {me?.role === "admin" && (
            <Button asChild variant="ghost" className="hidden sm:flex"><Link to="/admin"><LayoutDashboard className="h-4 w-4" /> {t("admin")}</Link></Button>
          )}
          <LanguageToggle />
          <NotificationBell />
          <Button asChild variant="ghost" size="icon"><Link to="/signup" aria-label="Account">
            <User className="h-5 w-5" />
          </Link></Button>
          <Button asChild variant="ghost" size="icon"><Link to="/cart" aria-label="Cart" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-secondary px-1 text-xs font-bold text-secondary-foreground">
                {count}
              </span>
            )}
          </Link></Button>
        </div>
      </div>
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-4 pb-2 text-xs opacity-90">
        <MapPin className="h-3.5 w-3.5" />
        {t("deliveryIn")}
      </div>
      {onQuery && (
        <div className="mx-auto max-w-5xl px-4 pb-3">
          <div className="relative flex items-center rounded-lg border bg-muted pr-1"><input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={t("search")}
            aria-label="Search products"
            className="min-w-0 flex-1 rounded-lg bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <VoiceSearchButton onResult={onQuery} /></div>
        </div>
      )}
    </header>
  );
}
