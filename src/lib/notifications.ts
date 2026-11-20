import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { currentAccount, hydrateAccounts, useAccounts } from "@/lib/accounts";
import { hydrate, useStore, type AdminNotification } from "@/lib/store";
import { visibleToUser, unreadRows } from "@/lib/notification-rules";

export function ownNotifications(rows: AdminNotification[], userId: string | null) {
  return visibleToUser(rows, userId);
}
export function unreadNotifications(rows: AdminNotification[], readIds: string[]) {
  return unreadRows(rows, readIds);
}
export function useNotifications() {
  const me = currentAccount(useAccounts());
  const state = useStore();
  const [receipts, setReceipts] = useState<{ userId: string; ids: string[] }>({ userId: "", ids: [] });
  const [error, setError] = useState("");
  useEffect(() => { hydrateAccounts(); hydrate(); }, []);
  useEffect(() => {
    let alive = true;
    if (!me) return;
    const load = async () => {
      const result = await supabase.from("notification_reads").select("notification_id").eq("user_id", me.id);
      if (alive) {
        setError(result.error ? "Notifications could not load. Please retry." : "");
        if (!result.error) setReceipts({ userId: me.id, ids: (result.data ?? []).map(r => r.notification_id) });
      }
    };
    void load();
    const ch = supabase.channel(`notification-reads-${me.id}-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notification_reads", filter: `user_id=eq.${me.id}` }, () => { void load(); }).subscribe();
    const focus = () => { void load(); };
    window.addEventListener("focus", focus);
    return () => { alive = false; window.removeEventListener("focus", focus); void supabase.removeChannel(ch); };
  }, [me?.id]);
  const rows = ownNotifications(state.notifications, me?.id ?? null);
  const ids = receipts.userId === me?.id ? receipts.ids : [];
  const unread = unreadNotifications(rows, ids);
  async function markRead(selected: AdminNotification[]) {
    if (!me || !selected.length) return;
    const { error } = await supabase.from("notification_reads").upsert(selected.map(n => ({ user_id: me.id, notification_id: n.id })), { onConflict: "user_id,notification_id" });
    if (error) throw new Error(error.message);
    setReceipts({ userId: me.id, ids: [...new Set([...ids, ...selected.map(n => n.id)])] });
  }
  return { rows, unread, readIds: ids, markRead, me, error };
}