import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ShoppingCart, ClipboardList, LayoutDashboard } from "lucide-react";
import { cartCount, useStore } from "@/lib/store";
import { currentAccount, hydrateAccounts, useAccounts } from "@/lib/accounts";
import { useEffect } from "react";
import { useLang } from "@/lib/i18n";

const items = [
  { to: "/", label: "home", icon: Home },
  { to: "/cart", label: "cart", icon: ShoppingCart },
  { to: "/orders", label: "orders", icon: ClipboardList },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const state = useStore();
  const accState = useAccounts();
  const me = currentAccount(accState);
  const count = cartCount(state);
  const { t } = useLang();

  useEffect(() => { hydrateAccounts(); }, []);

  const navItems = me?.role === "admin"
    ? [...items, { to: "/admin", label: "admin", icon: LayoutDashboard } as const]
    : items;

  return (
    <nav className="sticky bottom-0 z-30 px-3 pb-3 pt-1">
      <div className="glass mx-auto flex max-w-md rounded-3xl border p-1.5 shadow-lift">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-semibold transition-all ${
                active ? "brand-gradient text-primary-foreground shadow-lift" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {t(label)}
              {to === "/cart" && count > 0 && (
                <span className="absolute right-1/4 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-secondary ring-2 ring-card px-1 text-[10px] font-bold text-secondary-foreground">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
