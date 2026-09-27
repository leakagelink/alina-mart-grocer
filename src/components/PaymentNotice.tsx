import { useEffect, useState } from "react";
import { AlertTriangle, Clock3 } from "lucide-react";
import logo from "@/assets/alina-logo.jpg.asset.json";

// One shared deadline for every visitor; it does not restart on reload or another device.
const PAYMENT_DEADLINE = Date.parse("2026-10-04T10:52:33Z");

function timeParts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return [
    Math.floor(total / 86400),
    Math.floor((total % 86400) / 3600),
    Math.floor((total % 3600) / 60),
    total % 60,
  ];
}

export function PaymentNotice() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const remaining = now === null ? null : Math.max(0, PAYMENT_DEADLINE - now);
  const expired = remaining === 0;
  const values = remaining === null ? [7, 0, 0, 0] : timeParts(remaining);
  const units = [
    { en: "Days", hi: "दिन", value: values[0] ?? 0 },
    { en: "Hours", hi: "घंटे", value: values[1] ?? 0 },
    { en: "Minutes", hi: "मिनट", value: values[2] ?? 0 },
    { en: "Seconds", hi: "सेकंड", value: values[3] ?? 0 },
  ];

  const notice = (
    <div className="mx-auto w-full max-w-3xl px-5 py-8 text-center sm:py-10">
      <div className="mb-3 flex items-center justify-center gap-2">
        <img src={logo.url} alt="Alina Mart" className="size-9 rounded-md object-cover" />
        <span className="text-base font-bold text-foreground">Alina Mart</span>
      </div>
      <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase text-destructive">
        <AlertTriangle className="size-4" aria-hidden="true" /> Payment notice · भुगतान सूचना
      </div>
      <h2 className="text-lg font-bold leading-snug text-foreground sm:text-2xl">
        Alina Mart service is temporarily unavailable
      </h2>
      <p className="mt-1 text-base font-semibold text-foreground sm:text-lg">
        Alina Mart की सेवा अस्थायी रूप से बंद है
      </p>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Service is currently paused due to an outstanding payment. Please settle the payment with your service provider to restore access.
      </p>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        बकाया भुगतान के कारण सेवा अभी अस्थायी रूप से बंद है। ऐप दोबारा शुरू कराने के लिए कृपया अपने सेवा प्रदाता से संपर्क कर बकाया भुगतान करें।
      </p>
      {!expired && (
        <div className="mt-5" role="timer" aria-label="Time remaining to settle payment">
          <div className="mb-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-foreground">
              <Clock3 className="size-3.5" aria-hidden="true" /> Payment deadline · भुगतान की समय-सीमा
          </div>
          <div className="flex justify-center gap-2 sm:gap-3">
            {units.map((unit) => (
              <div key={unit.en} className="w-[68px] rounded-md border border-border bg-background px-1 py-2 sm:w-20">
                <div className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">{String(unit.value).padStart(2, "0")}</div>
                <div className="text-[10px] leading-tight text-muted-foreground sm:text-xs">{unit.en}<br />{unit.hi}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {expired && (
        <p className="mt-4 font-semibold text-destructive">
          The payment period has ended. Please contact your service provider to restore access.<br />
          भुगतान की अवधि समाप्त हो गई है। सेवा पुनः शुरू कराने के लिए कृपया अपने सेवा प्रदाता से संपर्क करें।
        </p>
      )}
    </div>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-background" aria-label="Payment notice">
      {notice}
    </main>
  );
}