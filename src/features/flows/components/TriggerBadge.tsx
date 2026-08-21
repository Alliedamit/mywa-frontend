import { TRIGGERS } from "../constants";
import type { FlowTrigger } from "../types";

export function TriggerBadge({ trigger }: { trigger: FlowTrigger }) {
  const def = TRIGGERS.find((t) => t.value === trigger);
  if (!def) return <span className="text-xs text-muted-foreground">{trigger}</span>;
  const Icon = def.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {def.label}
    </span>
  );
}
