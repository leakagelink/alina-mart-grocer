import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  currentAccount,
  deleteAccount,
  hydrateAccounts,
  resetPassword,
  setBlocked,
  useAccounts,
  type Role,
} from "@/lib/accounts";
import { useStore } from "@/lib/store";

const ROLE_LABEL: Record<Role, string> = { customer: "Customer", delivery: "Delivery partner", admin: "Admin" };

export function UsersAdmin() {
  const s = useAccounts();
  const store = useStore();
  const me = currentAccount(s);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"all" | Role>("all");
  useEffect(() => { hydrateAccounts(); }, []);

  const list = s.accounts.filter(
    (a) =>
      (role === "all" || a.role === role) &&
      (!q || a.name.toLowerCase().includes(q.toLowerCase()) || a.phone.includes(q)),
  );

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Naam ya mobile se search"
          className="min-w-48 flex-1 rounded-xl border bg-background px-3 py-2 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "all" | Role)}
          className="rounded-xl border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All users ({s.accounts.length})</option>
          <option value="customer">Customers</option>
          <option value="delivery">Delivery partners</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="mt-3 space-y-2">
        {list.map((a) => {
          const orders = store.orders.filter((o) => o.phone === a.phone).length;
          const isMe = a.id === me?.id;
          return (
            <div key={a.id} className="animate-card-in rounded-2xl border bg-card p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {a.name} {isMe && <span className="text-xs text-muted-foreground">(aap)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.phone} • {ROLE_LABEL[a.role]} • {orders} orders
                    {a.createdAt ? ` • Joined ${new Date(a.createdAt).toLocaleDateString("en-IN")}` : ""}
                  </p>
                </div>
                {a.blocked && (
                  <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-destructive-foreground">
                    Blocked
                  </span>
                )}
              </div>
              {!isMe && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                  <button
                    onClick={() => { setBlocked(a.id, !a.blocked); toast.success(a.blocked ? "Unblock ho gaya" : "Block ho gaya"); }}
                    className="rounded-lg bg-muted px-3 py-1.5 text-muted-foreground"
                  >
                    {a.blocked ? "Unblock" : "Block"}
                  </button>
                  <button
                    onClick={() => {
                      const pw = window.prompt(`${a.name} ka naya password (min 6)`);
                      if (!pw) return;
                      try { resetPassword(a.id, pw); toast.success("Password reset ho gaya"); }
                      catch (e) { toast.error((e as Error).message); }
                    }}
                    className="rounded-lg bg-secondary px-3 py-1.5 text-secondary-foreground"
                  >
                    Reset password
                  </button>
                  <button
                    onClick={() => {
                      if (!window.confirm(`${a.name} ka account delete karein?`)) return;
                      deleteAccount(a.id);
                      toast.success("Account delete ho gaya");
                    }}
                    className="rounded-lg bg-destructive px-3 py-1.5 text-destructive-foreground"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {!list.length && <p className="py-10 text-center text-sm text-muted-foreground">Koi user nahi mila</p>}
      </div>
    </div>
  );
}
