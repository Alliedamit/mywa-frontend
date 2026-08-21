import { formatDistanceToNow } from "date-fns";
import { AppDrawer } from "@/components/common/app-drawer";
import { FlowStatusBadge } from "./FlowStatusBadge";
import { TriggerBadge } from "./TriggerBadge";
import { FlowLogsList } from "./FlowLogsList";
import { conditionLabel, actionLabel } from "../utils";
import type { FlowRow } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flow: FlowRow | null;
}

export function FlowDetailsDrawer({ open, onOpenChange, flow }: Props) {
  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={flow?.name ?? "Flow"}
      description={flow?.description ?? undefined}
      widthClassName="sm:max-w-[480px]"
    >
      {!flow ? null : (
        <div className="flex flex-col gap-5 text-sm">
          <div className="flex items-center gap-2">
            <FlowStatusBadge status={flow.status} />
            <TriggerBadge trigger={flow.trigger} />
          </div>

          <Section title="Conditions">
            {flow.conditions.length === 0 ? (
              <p className="text-xs text-muted-foreground">Always</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {flow.conditions.map((c, i) => (
                  <li key={c.id} className="text-xs">
                    {i > 0 ? (
                      <span className="mr-1 font-medium uppercase text-muted-foreground">
                        {c.combinator}
                      </span>
                    ) : null}
                    {conditionLabel(c)}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Actions">
            <ul className="flex flex-col gap-1">
              {flow.actions.map((a) => (
                <li key={a.id} className="text-xs">
                  → {actionLabel(a)}
                </li>
              ))}
            </ul>
          </Section>

          <div className="grid grid-cols-2 gap-3">
            <Meta label="Runs" value={String(flow.run_count)} />
            <Meta
              label="Last run"
              value={
                flow.last_run_at
                  ? formatDistanceToNow(new Date(flow.last_run_at), { addSuffix: true })
                  : "—"
              }
            />
            <Meta
              label="Created"
              value={formatDistanceToNow(new Date(flow.created_at), { addSuffix: true })}
            />
            <Meta
              label="Updated"
              value={formatDistanceToNow(new Date(flow.updated_at), { addSuffix: true })}
            />
          </div>

          <Section title="Recent logs">
            <FlowLogsList flowId={flow.id} />
          </Section>
        </div>
      )}
    </AppDrawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border border-border/60 bg-card p-2.5">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}
