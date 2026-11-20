import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/lib/notifications";
import { useLang } from "@/lib/i18n";

export function NotificationBell() {
  const { unread } = useNotifications();
  const { lang } = useLang();
  return <Button asChild variant="ghost" size="icon" className="relative h-9 w-9 shrink-0" title={lang === "hi" ? "नोटिफिकेशन" : "Notifications"}>
    <Link to="/notifications" aria-label={lang === "hi" ? "नोटिफिकेशन" : "Notifications"}><Bell className="h-5 w-5" />{unread.length > 0 && <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-secondary px-1 text-[9px] font-bold text-secondary-foreground">{unread.length > 9 ? "9+" : unread.length}</span>}</Link>
  </Button>;
}