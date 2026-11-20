import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <div role="group" aria-label="Language" className="flex shrink-0 rounded-lg bg-muted p-0.5 text-xs font-bold">
      {(["en", "hi"] as const).map((l) => (
        <Button variant="ghost" size="sm"
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`h-8 min-w-8 px-2 text-xs font-bold ${lang === l ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "text-muted-foreground"}`}
        >
          {l === "en" ? "EN" : "हिं"}
        </Button>
      ))}
    </div>
  );
}
