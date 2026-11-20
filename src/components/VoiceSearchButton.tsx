import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { speechLanguage } from "@/lib/product-search";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

export function VoiceSearchButton({ onResult }: { onResult: (value: string) => void }) {
  const { lang } = useLang();
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");
  const active = useRef(false);
  const mounted = useRef(true);
  const stop = useRef<(() => void) | null>(null);
  const text = (en: string, hi: string) => lang === "hi" ? hi : en;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; active.current = false; stop.current?.(); };
  }, []);

  async function toggle() {
    if (active.current) {
      active.current = false;
      stop.current?.();
      setListening(false);
      setMessage("");
      return;
    }
    setMessage("");
    active.current = true;
    setListening(true);
    const finish = () => {
      active.current = false;
      stop.current = null;
      if (mounted.current) setListening(false);
    };
    const accept = (value?: string) => {
      if (!mounted.current || !active.current) return;
      if (value?.trim()) { onResult(value.trim()); setMessage(""); }
      else setMessage(text("Didn't catch that. Try again.", "आवाज़ समझ नहीं आई। फिर कोशिश करें।"));
    };
    try {
      if (!navigator.onLine) throw new Error("offline");
      if (Capacitor.isNativePlatform()) {
        const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");
        if (!Capacitor.isPluginAvailable("SpeechRecognition")) throw new Error("update");
        if (!(await SpeechRecognition.available()).available) throw new Error("unsupported");
        const permission = await SpeechRecognition.requestPermissions();
        if (permission.speechRecognition !== "granted") throw new Error("permission");
        if (!active.current || !mounted.current) return;
        stop.current = () => { void SpeechRecognition.stop().catch(() => {}); };
        const result = await SpeechRecognition.start({ language: speechLanguage(lang), maxResults: 1, popup: true, partialResults: false, prompt: text("Say a product name", "प्रोडक्ट का नाम बोलें") });
        accept(result.matches?.[0]);
        finish();
        return;
      }
      const scope = window as SpeechWindow;
      const Constructor = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
      if (!Constructor) throw new Error("unsupported");
      const recognition = new Constructor();
      recognition.lang = speechLanguage(lang);
      recognition.continuous = false;
      recognition.interimResults = false;
      stop.current = () => recognition.abort();
      recognition.onresult = event => accept(event.results[0]?.[0]?.transcript);
      recognition.onerror = event => {
        if (mounted.current && active.current && event.error !== "aborted") {
          setMessage(event.error === "not-allowed" || event.error === "service-not-allowed"
            ? text("Allow microphone access to search by voice.", "वॉइस सर्च के लिए माइक्रोफ़ोन की अनुमति दें।")
            : text("Voice search couldn't hear you. Check your internet and try again.", "आवाज़ नहीं सुन पाए। इंटरनेट जाँचकर फिर कोशिश करें।"));
        }
        finish();
      };
      recognition.onend = finish;
      recognition.start();
    } catch (error) {
      if (mounted.current && active.current) {
        const code = error instanceof Error ? error.message : "";
        setMessage(code === "permission" ? text("Allow microphone access in app settings.", "ऐप सेटिंग में माइक्रोफ़ोन की अनुमति दें।")
          : code === "update" ? text("Install the updated app for voice search.", "वॉइस सर्च के लिए अपडेटेड ऐप इंस्टॉल करें।")
          : code === "unsupported" ? text("Voice search isn't available here. Type a product name instead.", "यहाँ वॉइस सर्च उपलब्ध नहीं है। प्रोडक्ट का नाम टाइप करें।")
          : text("Check your internet and try voice search again.", "इंटरनेट जाँचकर वॉइस सर्च फिर करें।"));
      }
      finish();
    }
  }
  const label = listening ? text("Stop voice search", "वॉइस सर्च रोकें") : text("Search by voice", "बोलकर खोजें");
  return <>
    <Button type="button" variant={listening ? "default" : "ghost"} size="icon" className="h-10 w-10 shrink-0" aria-label={label} title={label} aria-pressed={listening} onClick={toggle}>
      {listening ? <Square className="h-4 w-4 motion-safe:animate-pulse" /> : <Mic className="h-5 w-5" />}
    </Button>
    {(listening || message) && <div role="status" aria-live="polite" className="absolute left-0 right-0 top-full z-40 mt-1 rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-sm">{listening ? text("Listening…", "सुन रहे हैं…") : message}</div>}
  </>;
}