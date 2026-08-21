import type { FlowCondition } from "@/features/flows/types";
import type { ConditionResult, EventPayload } from "./types";

/**
 * Condition Engine — evaluates flow conditions against an event payload.
 * Combines left-to-right using each condition's `combinator`.
 * Never throws.
 */
export function evaluate(conditions: FlowCondition[], payload: EventPayload): ConditionResult {
  if (!conditions || conditions.length === 0) {
    return { passed: true, details: ["No conditions — always runs."] };
  }

  const text = String(payload.text ?? "").toLowerCase();
  const tags = (payload.tags ?? []).map((t) => String(t).toLowerCase());
  const time = String(payload.time ?? "");
  const day = String(payload.day ?? "").toLowerCase();

  const details: string[] = [];
  const results: boolean[] = conditions.map((c) => {
    const v = String(c.value ?? "").toLowerCase();
    let r = false;
    try {
      switch (c.field) {
        case "message_text":
          r =
            c.operator === "contains"
              ? text.includes(v)
              : c.operator === "starts_with"
                ? text.startsWith(v)
                : c.operator === "ends_with"
                  ? text.endsWith(v)
                  : c.operator === "equals"
                    ? text === v
                    : false;
          break;
        case "contact_tag":
          r = tags.includes(v);
          break;
        case "time_of_day":
          r = time === c.value;
          break;
        case "day_of_week":
          r = day === v;
          break;
        case "always":
          r = true;
          break;
        default:
          r = false;
      }
    } catch (e) {
      console.error("[condition-engine]", e);
      r = false;
    }
    details.push(`${r ? "✓" : "✗"} ${c.field} ${c.operator} "${c.value}"`);
    return r;
  });

  let acc = results[0];
  for (let i = 1; i < results.length; i++) {
    acc = conditions[i].combinator === "or" ? acc || results[i] : acc && results[i];
  }
  return { passed: acc, details };
}
