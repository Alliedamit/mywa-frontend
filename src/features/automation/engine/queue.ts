import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { ResolvedAction } from "./types";
import { WHATSAPP_DEPENDENT_ACTIONS } from "./action-resolver";

type SB = SupabaseClient<Database>;

export interface EnqueueArgs {
  supabase: SB;
  workspaceId: string;
  flowId: string;
  flowExecutionId: string;
  actions: ResolvedAction[];
  isTest?: boolean;
}

export async function enqueueActions({
  supabase,
  workspaceId,
  flowId,
  flowExecutionId,
  actions,
  isTest = false,
}: EnqueueArgs) {
  if (actions.length === 0) return [];
  const rows = actions.map((a) => ({
    workspace_id: workspaceId,
    flow_id: flowId,
    flow_execution_id: flowExecutionId,
    action_type: a.action_type,
    payload: a.payload,
    status: WHATSAPP_DEPENDENT_ACTIONS.has(a.action_type) ? "waiting_whatsapp" : "pending",
    is_test: isTest,
  }));
  const { data, error } = await supabase
    .from("automation_queue")
    .insert(rows as unknown as Database["public"]["Tables"]["automation_queue"]["Insert"][])
    .select("id, action_type, status");
  if (error) {
    console.error("[queue.enqueue]", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Claim up to `limit` pending items where scheduled_for <= now().
 * Marks them running to avoid double-processing (no SKIP LOCKED via PostgREST,
 * so we use an update+returning pattern with a random claim token).
 */
export async function claimPending(supabase: SB, limit = 50) {
  const nowIso = new Date().toISOString();
  // Fetch candidate ids
  const { data: candidates, error: cErr } = await supabase
    .from("automation_queue")
    .select("id")
    .eq("status", "pending")
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .limit(limit);
  if (cErr) {
    console.error("[queue.claim.select]", cErr.message);
    return [];
  }
  const ids = (candidates ?? []).map((r) => r.id);
  if (ids.length === 0) return [];

  const { data: claimed, error: uErr } = await supabase
    .from("automation_queue")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: "running" } as any)
    .in("id", ids)
    .eq("status", "pending")
    .select("*");
  if (uErr) {
    console.error("[queue.claim.update]", uErr.message);
    return [];
  }
  return claimed ?? [];
}

export async function markCompleted(supabase: SB, id: string) {
  await supabase
    .from("automation_queue")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: "completed", executed_at: new Date().toISOString(), last_error: null } as any)
    .eq("id", id);
}

export async function markFailed(
  supabase: SB,
  id: string,
  attempts: number,
  maxAttempts: number,
  err: string,
) {
  const nextAttempts = attempts + 1;
  const done = nextAttempts >= maxAttempts;
  const backoffMinutes = Math.min(60, Math.pow(2, nextAttempts));
  const scheduledFor = new Date(Date.now() + backoffMinutes * 60_000).toISOString();
  await supabase
    .from("automation_queue")
    .update({
      status: done ? "failed" : "pending",
      attempts: nextAttempts,
      last_error: err.slice(0, 2000),
      scheduled_for: scheduledFor,
      executed_at: done ? new Date().toISOString() : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .eq("id", id);
}

export async function cancelItem(supabase: SB, id: string) {
  await supabase
    .from("automation_queue")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: "cancelled" } as any)
    .eq("id", id);
}

export async function retryItem(supabase: SB, id: string) {
  await supabase
    .from("automation_queue")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: "pending", scheduled_for: new Date().toISOString(), last_error: null } as any)
    .eq("id", id);
}
