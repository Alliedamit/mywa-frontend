import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { tagsQueryOptions } from "../tags.queries";
import { companyOptionsQuery } from "../queries";
import type { SegmentGroup, SegmentRule } from "../types";
import { isSegmentGroup } from "../types";

interface Props {
  value: SegmentGroup;
  onChange: (next: SegmentGroup) => void;
  depth?: number;
}

interface FieldDef {
  key: string;
  label: string;
  operators: string[];
  valueType: "text" | "date" | "tag" | "company" | "none";
}

const FIELDS: FieldDef[] = [
  { key: "company", label: "Company", operators: ["equals"], valueType: "company" },
  { key: "industry", label: "Industry", operators: ["contains", "equals"], valueType: "text" },
  { key: "created_at", label: "Created after", operators: ["after", "before"], valueType: "date" },
  { key: "tag", label: "Has tag", operators: ["equals", "not_equals"], valueType: "tag" },
  { key: "owner", label: "Owner", operators: ["equals"], valueType: "text" },
  {
    key: "email_exists",
    label: "Email exists",
    operators: ["is_true", "is_false"],
    valueType: "none",
  },
  {
    key: "whatsapp_exists",
    label: "WhatsApp exists",
    operators: ["is_true", "is_false"],
    valueType: "none",
  },
];

function defaultRule(): SegmentRule {
  return { field: "company", operator: "equals", value: "" };
}

export function RuleBuilder({ value, onChange, depth = 0 }: Props) {
  const { data: workspace } = useCurrentWorkspace();
  const tagsQ = useQuery({
    ...tagsQueryOptions(workspace?.id ?? ""),
    enabled: Boolean(workspace?.id),
  });
  const companiesQ = useQuery({
    ...companyOptionsQuery(workspace?.id ?? "", ""),
    enabled: Boolean(workspace?.id),
  });

  const updateRule = (index: number, next: SegmentRule | SegmentGroup) => {
    const rules = value.rules.slice();
    rules[index] = next;
    onChange({ ...value, rules });
  };

  const removeRule = (index: number) => {
    const rules = value.rules.slice();
    rules.splice(index, 1);
    onChange({ ...value, rules });
  };

  const addRule = () => {
    onChange({ ...value, rules: [...value.rules, defaultRule()] });
  };

  const addGroup = () => {
    if (depth >= 1) return; // cap nesting at 2 levels
    onChange({
      ...value,
      rules: [...value.rules, { combinator: "and", rules: [defaultRule()] }],
    });
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-muted/20 p-3",
        depth > 0 && "bg-muted/40",
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Match</span>
        <Select
          value={value.combinator}
          onValueChange={(v) => onChange({ ...value, combinator: v as "and" | "or" })}
        >
          <SelectTrigger className="h-7 w-[80px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">AND</SelectItem>
            <SelectItem value="or">OR</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">of the following</span>
      </div>

      <div className="flex flex-col gap-2">
        {value.rules.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">No rules yet.</p>
        ) : (
          value.rules.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1">
                {isSegmentGroup(r) ? (
                  <RuleBuilder
                    value={r}
                    onChange={(next) => updateRule(i, next)}
                    depth={depth + 1}
                  />
                ) : (
                  <SingleRule
                    rule={r}
                    onChange={(next) => updateRule(i, next)}
                    tags={tagsQ.data ?? []}
                    companies={companiesQ.data ?? []}
                  />
                )}
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={() => removeRule(i)}
                aria-label="Remove"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={addRule}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add rule
        </Button>
        {depth < 1 ? (
          <Button type="button" size="sm" variant="ghost" onClick={addGroup}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add group
          </Button>
        ) : null}
      </div>
    </div>
  );
}

interface SingleProps {
  rule: SegmentRule;
  onChange: (next: SegmentRule) => void;
  tags: { id: string; name: string }[];
  companies: { id: string; company_name: string }[];
}

function SingleRule({ rule, onChange, tags, companies }: SingleProps) {
  const field = useMemo(() => FIELDS.find((f) => f.key === rule.field) ?? FIELDS[0], [rule.field]);

  return (
    <div className="grid grid-cols-1 gap-2 rounded-md border border-border/60 bg-background p-2 sm:grid-cols-[1fr_1fr_1.4fr]">
      <Select
        value={rule.field}
        onValueChange={(v) => {
          const next = FIELDS.find((f) => f.key === v)!;
          onChange({ field: v, operator: next.operators[0], value: "" });
        }}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FIELDS.map((f) => (
            <SelectItem key={f.key} value={f.key}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={rule.operator} onValueChange={(v) => onChange({ ...rule, operator: v })}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {field.operators.map((op) => (
            <SelectItem key={op} value={op}>
              {op.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {field.valueType === "none" ? (
        <div className="text-xs text-muted-foreground">—</div>
      ) : field.valueType === "date" ? (
        <Input
          type="date"
          className="h-8 text-xs"
          value={String(rule.value ?? "")}
          onChange={(e) => onChange({ ...rule, value: e.target.value })}
        />
      ) : field.valueType === "tag" ? (
        <Select
          value={String(rule.value ?? "")}
          onValueChange={(v) => onChange({ ...rule, value: v })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select tag" />
          </SelectTrigger>
          <SelectContent>
            {tags.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.valueType === "company" ? (
        <Select
          value={String(rule.value ?? "")}
          onValueChange={(v) => onChange({ ...rule, value: v })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          className="h-8 text-xs"
          value={String(rule.value ?? "")}
          onChange={(e) => onChange({ ...rule, value: e.target.value })}
          placeholder="Value"
        />
      )}
    </div>
  );
}
