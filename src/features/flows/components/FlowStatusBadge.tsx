import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FlowStatus } from "../types";

const STYLES: Record<FlowStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  paused: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  archived: "bg-destructive/10 text-destructive",
};

const LABELS: Record<FlowStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

export function FlowStatusBadge({ status }: { status: FlowStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-0 font-medium", STYLES[status])}>
      {LABELS[status]}
    </Badge>
  );
}
