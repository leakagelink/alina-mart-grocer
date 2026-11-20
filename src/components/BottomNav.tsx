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
    <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-30 border-t bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg px-3">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-16 flex-1 flex-col items-center justify-center gap-1 border-t-2 text-[11px] font-semibold transition-all ${
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground"
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
