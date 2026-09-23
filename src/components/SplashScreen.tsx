import { useEffect, useState } from "react";
import logo from "@/assets/alina-logo.jpg.asset.json";

const SPLASH_MS = 2100;
const FADE_MS = 400;

export function SplashScreen() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem("alina-splash-seen");
  });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    sessionStorage.setItem("alina-splash-seen", "1");
    const t1 = setTimeout(() => setLeaving(true), SPLASH_MS);
    const t2 = setTimeout(() => setVisible(false), SPLASH_MS + FADE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center brand-gradient text-primary-foreground transition-opacity ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      aria-hidden
    >
      <img
        src={logo.url}
        alt="Alina Mart"
        className="splash-logo h-28 w-28 rounded-3xl bg-white object-cover shadow-2xl"
      />
      <h1 className="splash-text mt-5 text-3xl font-extrabold tracking-tight">
        Alina<span className="text-secondary">Mart</span>
      </h1>
      <p className="splash-text splash-text-delay mt-2 text-sm font-medium opacity-90">
        Groceries • Daily Essentials • More
      </p>
      <div className="splash-bar mt-8 h-1 w-28 overflow-hidden rounded-full bg-white/25">
        <div className="splash-bar-fill h-full rounded-full bg-secondary" />
      </div>
    </div>
  );
}
