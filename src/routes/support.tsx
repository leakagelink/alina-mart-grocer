import { createFileRoute } from "@tanstack/react-router";
import { Headphones } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SupportInbox } from "@/components/SupportInbox";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [
    { title: "Customer Support — Martigo" },
    { name: "description", content: "Contact Martigo support about your orders, delivery or account and view replies to your requests." },
    { property: "og:title", content: "Customer Support — Martigo" },
    { property: "og:description", content: "Your Martigo customer support requests and replies." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: SupportPage,
});

function SupportPage() {
  const { lang } = useLang();
  return <div className="min-h-screen bg-background text-foreground"><Header /><main className="mx-auto max-w-3xl px-4 pb-28 pt-5"><h1 className="mb-6 flex items-center gap-2 text-xl font-extrabold"><Headphones className="h-6 w-6 text-primary" />{lang === "hi" ? "कस्टमर सपोर्ट" : "Customer support"}</h1><SupportInbox /></main><BottomNav /></div>;
}