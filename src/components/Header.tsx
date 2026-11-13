import { Link } from "@tanstack/react-router";
import { MapPin, ShoppingCart, LayoutDashboard, User } from "lucide-react";
import logo from "@/assets/martigo-icon.png.asset.json";
import { cartCount, useStore } from "@/lib/store";
import { currentAccount, hydrateAccounts, useAccounts } from "@/lib/accounts";
import { useEffect } from "react";
import { useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { BackButton } from "@/components/BackButton";

export function Header({ query, onQuery }: { query?: string; onQuery?: (v: string) => void }) {
  const state = useStore();
  const accState = useAccounts();
  const me = currentAccount(accState);
  const count = cartCount(state);
  const { t } = useLang();

  useEffect(() => { hydrateAccounts(); }, []);

  return (
    <header className="sticky top-0 z-30 brand-gradient rounded-b-3xl text-primary-foreground shadow-lift">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
        <BackButton />
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img
            src={logo.url}
            alt="Martigo"
            className="animate-float h-9 w-9 shrink-0 drop-shadow sm:h-10 sm:w-10"
          />
          <span className="truncate text-base font-extrabold leading-none sm:text-lg">
            Marti<span className="text-secondary">go</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {me?.role === "admin" && (
            <Link
              to="/admin"
              className="hidden items-center gap-1 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium sm:flex"
            >
              <LayoutDashboard className="h-4 w-4" /> {t("admin")}
            </Link>
          )}
          <LanguageToggle />
          <Link to="/signup" aria-label="Account" className="rounded-lg bg-white/15 p-2">
            <User className="h-5 w-5" />
          </Link>
          <Link to="/cart" className="relative rounded-lg bg-white/15 p-2">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-secondary px-1 text-xs font-bold text-secondary-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-4 pb-2 text-xs opacity-90">
        <MapPin className="h-3.5 w-3.5" />
        {t("deliveryIn")}
      </div>
      {onQuery && (
        <div className="mx-auto max-w-5xl px-4 pb-3">
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={t("search")}
            className="w-full rounded-xl bg-white px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      )}
    </header>
  );
}
