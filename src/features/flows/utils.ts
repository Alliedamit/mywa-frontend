import { TRIGGERS, CONDITIONS, ACTIONS } from "./constants";
import type { FlowAction, FlowCondition, FlowTrigger } from "./types";

export function triggerLabel(v: FlowTrigger): string {
  return TRIGGERS.find((t) => t.value === v)?.label ?? v;
}

export function conditionLabel(c: FlowCondition): string {
  const def = CONDITIONS.find((d) => d.value === c.field);
  const opLabel = def?.operators.find((o) => o.value === c.operator)?.label ?? c.operator;
  if (c.field === "always") return "Always";
  return `${def?.label ?? c.field} ${opLabel}${c.value ? ` "${c.value}"` : ""}`;
}

export function actionLabel(a: FlowAction): string {
  const def = ACTIONS.find((d) => d.value === a.type);
  const label = def?.label ?? a.type;
  const paramText = describeActionParam(a);
  return paramText ? `${label} — ${paramText}` : label;
}

export function describeActionParam(a: FlowAction): string {
  const def = ACTIONS.find((d) => d.value === a.type);
  if (!def) return "";
  switch (def.paramKind) {
    case "template":
      return String(a.params.template_name ?? "");
    case "media":
      return String(a.params.media_name ?? "");
    case "tag":
      return String(a.params.tag_name ?? "");
    case "text":
      return String(a.params.text ?? "");
    default:
      return "";
  }
}

export function nextId() {
  return crypto.randomUUID();
}

export function evaluateConditions(
  conditions: FlowCondition[],
  sample: { text: string; tags: string[]; time: string; day: string },
): { passed: boolean; details: string[] } {
  if (conditions.length === 0) return { passed: true, details: ["No conditions — always runs."] };
  const details: string[] = [];
  const results: boolean[] = conditions.map((c) => {
    let r = false;
    switch (c.field) {
      case "message_text": {
        const t = sample.text.toLowerCase();
        const v = c.value.toLowerCase();
        r =
          c.operator === "contains"
            ? t.includes(v)
            : c.operator === "starts_with"
              ? t.startsWith(v)
              : c.operator === "ends_with"
                ? t.endsWith(v)
                : c.operator === "equals"
                  ? t === v
                  : false;
        break;
      }
      case "contact_tag":
        r = sample.tags.map((x) => x.toLowerCase()).includes(c.value.toLowerCase());
        break;
      case "time_of_day":
        r = sample.time === c.value;
        break;
      case "day_of_week":
        r = sample.day.toLowerCase() === c.value.toLowerCase();
        break;
      case "always":
        r = true;
        break;
    }
    details.push(`${r ? "✓" : "✗"} ${c.field} ${c.operator} "${c.value}"`);
    return r;
  });

  // Combine left-to-right with per-rule combinator (rule i uses conditions[i].combinator against accumulator)
  let acc = results[0];
  for (let i = 1; i < results.length; i++) {
    acc = conditions[i].combinator === "or" ? acc || results[i] : acc && results[i];
  }
  return { passed: acc, details };
}
