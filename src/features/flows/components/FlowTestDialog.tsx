import { useMemo, useState } from "react";
import { ArrowDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/lib/notify";

import { evaluateConditions, triggerLabel, actionLabel, conditionLabel } from "../utils";
import { runFlowTest } from "@/features/automation/automation.functions";
import type { FlowRow } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flow: FlowRow | null;
}

export function FlowTestDialog({ open, onOpenChange, flow }: Props) {
  const qc = useQueryClient();
  const [text, setText] = useState("hello");
  const [tags, setTags] = useState("vip");
  const [time, setTime] = useState("09:00");
  const [day, setDay] = useState("monday");

  const result = useMemo(() => {
    if (!flow) return null;
    return evaluateConditions(flow.conditions, {
      text,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      time,
      day,
    });
  }, [flow, text, tags, time, day]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!flow) return;
      await runFlowTest({
        data: {
          flowId: flow.id,
          workspaceId: flow.workspace_id,
          sample: {
            text,
            tags: tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            time,
            day,
          },
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flows"] });
      qc.invalidateQueries({ queryKey: ["flow-logs"] });
      qc.invalidateQueries({ queryKey: ["flow-executions"] });
      notify.success("Simulation logged.");
    },
    onError: (e: unknown) => notify.error(e instanceof Error ? e.message : "Simulation failed"),
  });

  if (!flow) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Test flow — {flow.name}</DialogTitle>
          <DialogDescription>Provide sample data. No real messages are sent.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Sample message text</Label>
            <Input value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Tags (comma separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Time</Label>
            <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="09:00" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Day of week</Label>
            <Input value={day} onChange={(e) => setDay(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-border/60 bg-muted/30 p-3 text-xs">
          <PipelineStep title="Trigger" body={triggerLabel(flow.trigger)} />
          <ArrowDown className="mx-auto h-3 w-3 text-muted-foreground" />
          <PipelineStep
            title="Conditions"
            body={
              flow.conditions.length === 0
                ? "Always"
                : flow.conditions
                    .map(
                      (c, i) =>
                        `${i > 0 ? c.combinator.toUpperCase() + " " : ""}${conditionLabel(c)}`,
                    )
                    .join(" ")
            }
          />
          <ArrowDown className="mx-auto h-3 w-3 text-muted-foreground" />
          <PipelineStep
            title="Actions"
            body={flow.actions.map((a) => actionLabel(a)).join(" • ") || "—"}
          />
          <ArrowDown className="mx-auto h-3 w-3 text-muted-foreground" />
          <div
            className={`rounded-md border p-2 text-xs font-medium ${
              result?.passed
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            }`}
          >
            {result?.passed
              ? "✓ Conditions passed — actions would run."
              : "✗ Conditions did not match."}
          </div>
          {result?.details.length ? (
            <ul className="ml-1 list-none text-[11px] text-muted-foreground">
              {result.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Logging…" : "Log simulation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PipelineStep({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-card p-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </span>
      <span className="text-xs">{body}</span>
    </div>
  );
}
