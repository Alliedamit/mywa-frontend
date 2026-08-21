import { Progress } from "@/components/ui/progress";
import type { WhatsAppSyncState } from "../types";

const PHASE_LABEL: Record<WhatsAppSyncState["phase"], string> = {
  idle: "Idle",
  contacts: "Syncing contacts",
  chats: "Syncing chats",
  messages: "Syncing messages",
  done: "Synced",
  failed: "Sync failed",
};

interface Props {
  sync: WhatsAppSyncState | null;
}

export function SyncProgress({ sync }: Props) {
  if (!sync || sync.phase === "idle") return null;
  const pct =
    sync.total > 0
      ? Math.round((sync.processed / sync.total) * 100)
      : sync.phase === "done"
        ? 100
        : 5;
  const active = sync.phase !== "done" && sync.phase !== "failed";
  return (
    <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{PHASE_LABEL[sync.phase]}</span>
        <span className="text-muted-foreground">
          {sync.processed}
          {sync.total > 0 ? ` / ${sync.total}` : ""}
        </span>
      </div>
      <Progress value={pct} className={active ? "" : "opacity-70"} />
      {sync.phase === "failed" && sync.last_error ? (
        <p className="text-xs text-destructive">{sync.last_error}</p>
      ) : null}
    </div>
  );
}
