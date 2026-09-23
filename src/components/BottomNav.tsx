import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ShoppingCart, ClipboardList, LayoutDashboard } from "lucide-react";
import { cartCount, useStore } from "@/lib/store";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/cart", label: "Cart", icon: ShoppingCart },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin", label: "Admin", icon: LayoutDashboard },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const state = useStore();
  const count = cartCount(state);

  return (
    <nav className="sticky bottom-0 z-30 border-t bg-card">
      <div className="mx-auto flex max-w-5xl">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
              {to === "/cart" && count > 0 && (
                <span className="absolute right-1/4 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-secondary px-1 text-[10px] font-bold text-secondary-foreground">
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
