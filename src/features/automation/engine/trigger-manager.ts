import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { AutomationEvent, EngineFlow } from "./types";
import type { FlowRow } from "@/features/flows/types";

type SB = SupabaseClient<Database>;

/**
 * Trigger Manager — finds active flows for a given event's workspace and trigger type.
 * Never throws; returns [] on error and logs.
 */
export async function findMatchingFlows(
  supabase: SB,
  event: AutomationEvent,
): Promise<EngineFlow[]> {
  try {
    const { data, error } = await supabase
      .from("flows")
      .select("*")
      .eq("workspace_id", event.workspaceId)
      .eq("trigger", event.type)
      .eq("status", "active");
    if (error) {
      console.error("[trigger-manager]", error.message);
      return [];
    }
    return (data ?? []) as unknown as FlowRow[] as EngineFlow[];
  } catch (e) {
    console.error("[trigger-manager] unexpected", e);
    return [];
  }
}
