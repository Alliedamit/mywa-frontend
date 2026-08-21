import type { FlowAction } from "@/features/flows/types";
import type { AutomationEvent, ResolvedAction } from "./types";

/**
 * Action Resolver — turns configured flow actions + the triggering event
 * into concrete queue payloads. Does NOT execute.
 */
export function resolveActions(actions: FlowAction[], event: AutomationEvent): ResolvedAction[] {
  return actions
    .filter((a) => a.type !== "delay") // future placeholder
    .map((a) => ({
      action_type: a.type,
      payload: {
        ...a.params,
        _event: {
          type: event.type,
          contactId: event.payload.contactId ?? null,
          conversationId: event.payload.conversationId ?? null,
          text: event.payload.text ?? null,
        },
      },
    }));
}

export const WHATSAPP_DEPENDENT_ACTIONS = new Set(["insert_template", "attach_media"]);
