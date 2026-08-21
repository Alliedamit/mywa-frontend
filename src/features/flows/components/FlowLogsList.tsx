import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle2, PlayCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { flowLogsQueryOptions } from "../queries";
import { cn } from "@/lib/utils";

export function FlowLogsList({ flowId }: { flowId: string }) {
  const q = useQuery(flowLogsQueryOptions(flowId, 25));
  if (q.isLoading) return <p className="p-4 text-xs text-muted-foreground">Loading logs…</p>;
  const logs = q.data ?? [];
  if (logs.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
        No runs yet. Use "Test flow" to simulate.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {logs.map((l) => {
        const Icon =
          l.status === "failed"
            ? AlertCircle
            : l.status === "simulated"
              ? PlayCircle
              : CheckCircle2;
        const tone =
          l.status === "failed"
            ? "text-destructive"
            : l.status === "simulated"
              ? "text-primary"
              : "text-emerald-600 dark:text-emerald-400";
        return (
          <li
            key={l.id}
            className="flex items-start gap-2 rounded-md border border-border/60 bg-card p-2.5"
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium capitalize">{l.status}</span>
                <span className="text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                </span>
              </div>
              {l.message ? (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{l.message}</p>
              ) : null}
              {l.execution_time_ms != null ? (
                <p className="text-[11px] text-muted-foreground">{l.execution_time_ms}ms</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
