import { useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function BackButton({ floating = false }: { floating?: boolean }) {
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path === "/") return null;
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.history.back();
    else router.navigate({ to: "/" });
  };
  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Back"
      className={
        floating
          ? "fixed left-3 top-3 z-40 grid h-10 w-10 place-items-center rounded-full bg-card text-foreground shadow-lg active:scale-95"
          : "grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 active:scale-95"
      }
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}
