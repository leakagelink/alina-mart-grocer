import { Link } from "@tanstack/react-router";
import { MapPin, ShoppingCart, LayoutDashboard } from "lucide-react";
import logo from "@/assets/alina-logo.jpg.asset.json";
import { cartCount, useStore } from "@/lib/store";

export function Header({ query, onQuery }: { query?: string; onQuery?: (v: string) => void }) {
  const state = useStore();
  const count = cartCount(state);

  return (
    <header className="sticky top-0 z-30 brand-gradient text-primary-foreground">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logo.url}
            alt="Alina Mart"
            className="h-10 w-10 rounded-xl bg-white object-cover"
          />
          <span className="text-lg font-extrabold leading-none">
            Alina<span className="text-secondary">Mart</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/admin"
            className="hidden items-center gap-1 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium sm:flex"
          >
            <LayoutDashboard className="h-4 w-4" /> Admin
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
        Delivery in 15 min • Indore, MP 452001
      </div>
      {onQuery && (
        <div className="mx-auto max-w-5xl px-4 pb-3">
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search for milk, bread, atta…"
            className="w-full rounded-xl bg-white px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      )}
    </header>
  );
}
