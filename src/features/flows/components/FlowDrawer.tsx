import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

import { AppDrawer } from "@/components/common/app-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentWorkspace } from "@/hooks/use-workspace";

import { TRIGGERS, CONDITIONS, ACTIONS } from "../constants";
import { flowSchema } from "../validation";
import { createFlow, updateFlow } from "../mutations";
import { nextId, triggerLabel, conditionLabel, actionLabel } from "../utils";
import type {
  FlowAction,
  FlowActionType,
  FlowCondition,
  FlowConditionField,
  FlowRow,
  FlowStatus,
  FlowTrigger,
} from "../types";
import { FlowStatusBadge } from "./FlowStatusBadge";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flow?: FlowRow | null;
}

const STEPS = ["Basics", "Trigger", "Conditions", "Actions", "Review"] as const;

interface Draft {
  name: string;
  description: string;
  trigger: FlowTrigger;
  conditions: FlowCondition[];
  actions: FlowAction[];
  status: FlowStatus;
}

const EMPTY: Draft = {
  name: "",
  description: "",
  trigger: "message_received",
  conditions: [],
  actions: [],
  status: "draft",
};

export function FlowDrawer({ open, onOpenChange, flow }: Props) {
  const isEdit = Boolean(flow);
  const { data: workspace } = useCurrentWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    if (flow) {
      setDraft({
        name: flow.name,
        description: flow.description ?? "",
        trigger: flow.trigger,
        conditions: flow.conditions ?? [],
        actions: flow.actions ?? [],
        status: flow.status,
      });
    } else {
      setDraft(EMPTY);
    }
  }, [open, flow]);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = flowSchema.parse(draft);
      if (!workspace) throw new Error("No workspace");
      if (isEdit && flow) await updateFlow(flow.id, parsed);
      else
        await createFlow({ workspaceId: workspace.id, userId: user?.id ?? null, values: parsed });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flows"] });
      notify.success(isEdit ? "Flow updated." : "Flow created.");
      onOpenChange(false);
    },
    onError: (e: unknown) => notify.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const canNext = useMemo(() => {
    if (step === 0) return draft.name.trim().length > 0;
    if (step === 3) return draft.actions.length > 0;
    return true;
  }, [step, draft]);

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit flow" : "New flow"}
      description="Automate repetitive tasks with a simple rule."
      widthClassName="sm:max-w-[560px]"
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <Button size="sm" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
                {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create flow"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <Stepper step={step} />

        {step === 0 ? (
          <div className="flex flex-col gap-4">
            <Field label="Flow name *">
              <Input
                autoFocus
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Auto-tag VIP messages"
              />
            </Field>
            <Field label="Description">
              <Textarea
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="What does this flow do?"
              />
            </Field>
            <Field label="Status">
              <Select
                value={draft.status}
                onValueChange={(v) => setDraft((d) => ({ ...d, status: v as FlowStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid grid-cols-1 gap-2">
            {TRIGGERS.map((t) => {
              const Icon = t.icon;
              const selected = draft.trigger === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, trigger: t.value }))}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:border-border hover:bg-accent/40",
                  )}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        {step === 2 ? (
          <ConditionsEditor
            value={draft.conditions}
            onChange={(conditions) => setDraft((d) => ({ ...d, conditions }))}
          />
        ) : null}

        {step === 3 ? (
          <ActionsEditor
            value={draft.actions}
            onChange={(actions) => setDraft((d) => ({ ...d, actions }))}
          />
        ) : null}

        {step === 4 ? <ReviewPanel draft={draft} /> : null}
      </div>
    </AppDrawer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                active
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {i + 1}
            </div>
            <span
              className={cn("text-xs truncate", active ? "font-medium" : "text-muted-foreground")}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ConditionsEditor({
  value,
  onChange,
}: {
  value: FlowCondition[];
  onChange: (v: FlowCondition[]) => void;
}) {
  const add = () => {
    onChange([
      ...value,
      { id: nextId(), field: "message_text", operator: "contains", value: "", combinator: "and" },
    ]);
  };
  const update = (id: string, patch: Partial<FlowCondition>) => {
    onChange(value.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };
  const remove = (id: string) => onChange(value.filter((c) => c.id !== id));

  return (
    <div className="flex flex-col gap-3">
      {value.length === 0 ? (
        <p className="rounded-md border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground">
          No conditions. Flow runs on every trigger.
        </p>
      ) : null}

      {value.map((c, idx) => {
        const def = CONDITIONS.find((d) => d.value === c.field);
        return (
          <div key={c.id} className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
            {idx > 0 ? (
              <div className="flex items-center gap-2">
                <Select
                  value={c.combinator}
                  onValueChange={(v) => update(c.id, { combinator: v as "and" | "or" })}
                >
                  <SelectTrigger className="h-7 w-[80px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="and">AND</SelectItem>
                    <SelectItem value="or">OR</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[11px] text-muted-foreground">combined with previous</span>
              </div>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select
                value={c.field}
                onValueChange={(v) => {
                  const nextDef = CONDITIONS.find((d) => d.value === (v as FlowConditionField));
                  update(c.id, {
                    field: v as FlowConditionField,
                    operator: (nextDef?.operators[0]?.value ??
                      "contains") as FlowCondition["operator"],
                    value: "",
                  });
                }}
              >
                <SelectTrigger className="sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={c.operator}
                onValueChange={(v) => update(c.id, { operator: v as FlowCondition["operator"] })}
              >
                <SelectTrigger className="sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(def?.operators ?? []).map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {c.field !== "always" ? (
                <Input
                  value={c.value}
                  onChange={(e) => update(c.id, { value: e.target.value })}
                  placeholder={def?.placeholder}
                  className="flex-1"
                />
              ) : (
                <div className="flex-1" />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove(c.id)}
                aria-label="Remove condition"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}

      <Button variant="outline" size="sm" onClick={add} className="w-fit">
        <Plus className="mr-1.5 h-4 w-4" /> Add condition
      </Button>
    </div>
  );
}

function ActionsEditor({
  value,
  onChange,
}: {
  value: FlowAction[];
  onChange: (v: FlowAction[]) => void;
}) {
  const add = () => {
    onChange([...value, { id: nextId(), type: "insert_template", params: {} }]);
  };
  const update = (id: string, patch: Partial<FlowAction>) => {
    onChange(value.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };
  const remove = (id: string) => onChange(value.filter((a) => a.id !== id));

  return (
    <div className="flex flex-col gap-3">
      {value.length === 0 ? (
        <p className="rounded-md border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground">
          Add at least one action.
        </p>
      ) : null}
      {value.map((a) => {
        const def = ACTIONS.find((d) => d.value === a.type);
        return (
          <div key={a.id} className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
            <div className="flex items-center gap-2">
              <Select
                value={a.type}
                onValueChange={(v) => update(a.id, { type: v as FlowActionType, params: {} })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value} disabled={d.disabled}>
                      {d.label}
                      {d.disabled ? " (soon)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove(a.id)}
                aria-label="Remove action"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {def?.paramKind === "text" ? (
              <Textarea
                rows={2}
                value={String(a.params.text ?? "")}
                onChange={(e) => update(a.id, { params: { ...a.params, text: e.target.value } })}
                placeholder={
                  def.value === "create_note" ? "Note content…" : "Notification message…"
                }
              />
            ) : null}
            {def && ["template", "media", "tag"].includes(def.paramKind) ? (
              <Input
                value={String(a.params[`${def.paramKind}_name`] ?? "")}
                onChange={(e) =>
                  update(a.id, {
                    params: { ...a.params, [`${def.paramKind}_name`]: e.target.value },
                  })
                }
                placeholder={
                  def.paramKind === "template"
                    ? "Template name or shortcut"
                    : def.paramKind === "media"
                      ? "Media file name"
                      : "Tag name"
                }
              />
            ) : null}
            {def ? <p className="text-[11px] text-muted-foreground">{def.description}</p> : null}
          </div>
        );
      })}
      <Button variant="outline" size="sm" onClick={add} className="w-fit">
        <Plus className="mr-1.5 h-4 w-4" /> Add action
      </Button>
    </div>
  );
}

function ReviewPanel({ draft }: { draft: Draft }) {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <ReviewRow label="Name" value={draft.name || "—"} />
      {draft.description ? <ReviewRow label="Description" value={draft.description} /> : null}
      <ReviewRow label="Trigger" value={triggerLabel(draft.trigger)} />
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Conditions</span>
        {draft.conditions.length === 0 ? (
          <span className="text-xs text-muted-foreground">Always</span>
        ) : (
          <ul className="flex flex-col gap-1">
            {draft.conditions.map((c, i) => (
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
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Actions</span>
        <ul className="flex flex-col gap-1">
          {draft.actions.map((a) => (
            <li key={a.id} className="text-xs">
              → {actionLabel(a)}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Status</span>
        <FlowStatusBadge status={draft.status} />
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
