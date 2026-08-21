import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  qr: string | null;
  expiresAt: string | null;
}

export function QrPanel({ qr, expiresAt }: Props) {
  const [remaining, setRemaining] = useState<number>(() => diff(expiresAt));

  useEffect(() => {
    setRemaining(diff(expiresAt));
    const t = setInterval(() => setRemaining(diff(expiresAt)), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  if (!qr) {
    return (
      <div className="flex h-[320px] w-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/30 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Waiting for QR code…
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-2xl border border-border/60 bg-background p-3 shadow-sm">
        <img
          src={qr}
          alt="Scan this QR with WhatsApp on your phone"
          className="h-[280px] w-[280px]"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {remaining > 0 ? `Refreshes in ${remaining}s` : "Refreshing…"}
      </p>
      <ol className="max-w-xs list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
        <li>Open WhatsApp on your phone.</li>
        <li>Tap Menu → Linked Devices → Link a device.</li>
        <li>Point your phone at this screen.</li>
      </ol>
    </div>
  );
}

function diff(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 1000));
}
