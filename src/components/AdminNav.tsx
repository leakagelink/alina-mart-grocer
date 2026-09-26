import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  TicketPercent,
  Menu,
  Bell,
  Settings,
  Bike,
  Users,
  Truck,
  X,
} from "lucide-react";

export type AdminNavTab =
  | "dashboard"
  | "orders"
  | "products"
  | "coupons"
  | "notifications"
  | "settings"
  | "riders"
  | "users"
  | "shipping";

const MAIN: { id: AdminNavTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "products", label: "Products", icon: Package },
  { id: "coupons", label: "Coupons", icon: TicketPercent },
];

const MORE: { id: AdminNavTab; label: string; icon: typeof Bell }[] = [
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "riders", label: "Delivery KYC", icon: Bike },
  { id: "users", label: "Users", icon: Users },
  { id: "shipping", label: "Shipping partners", icon: Truck },
  { id: "settings", label: "App settings", icon: Settings },
];

export function AdminNav({
  tab,
  onChange,
}: {
  tab: AdminNavTab;
  onChange: (t: AdminNavTab) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE.some((m) => m.id === tab);

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 sm:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}
      {moreOpen && (
        <div className="animate-fade-up fixed inset-x-0 bottom-16 z-50 mx-3 rounded-2xl border bg-card p-2 shadow-2xl sm:hidden">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-xs font-bold text-muted-foreground">Aur options</p>
            <button
              onClick={() => setMoreOpen(false)}
              className="rounded-lg p-1 text-muted-foreground"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {MORE.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onChange(m.id);
                setMoreOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                tab === m.id ? "bg-primary text-primary-foreground" : "text-foreground"
              }`}
            >
              <m.icon className="h-4 w-4" />
              {m.label}
            </button>
          ))}
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="grid grid-cols-5">
          {MAIN.map((m) => (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold ${
                tab === m.id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <m.icon className="h-5 w-5" />
              {m.label}
            </button>
          ))}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold ${
              moreActive || moreOpen ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Menu className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>
    </>
  );
}
