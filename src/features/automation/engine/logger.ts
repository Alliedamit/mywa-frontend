import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { ExecutionStatus } from "./types";

type SB = SupabaseClient<Database>;

export interface CreateExecutionArgs {
  workspaceId: string;
  flowId: string;
  triggerType: string;
  triggerPayload: Record<string, unknown>;
  isTest?: boolean;
}

export async function createExecution(
  supabase: SB,
  args: CreateExecutionArgs,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("flow_executions")

    .insert({
      workspace_id: args.workspaceId,
      flow_id: args.flowId,
      trigger_type: args.triggerType,
      trigger_payload: args.triggerPayload,
      status: "running",
      is_test: args.isTest ?? false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select("id")
    .single();
  if (error) {
    console.error("[logger.createExecution]", error.message);
    return null;
  }
  return data.id;
}

export async function completeExecution(
  supabase: SB,
  args: {
    executionId: string;
    flowId: string;
    status: ExecutionStatus;
    matched: boolean;
    startedAt: Date;
    error?: string | null;
    logMessage?: string;
  },
) {
  const completed = new Date();
  const ms = completed.getTime() - args.startedAt.getTime();
  await supabase
    .from("flow_executions")
    .update({
      status: args.status,
      matched_conditions: args.matched,
      completed_at: completed.toISOString(),
      execution_time_ms: ms,
      error_message: args.error ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .eq("id", args.executionId);

  // Legacy flow_logs mirror
  await supabase.from("flow_logs").insert({
    flow_id: args.flowId,
    workspace_id: (await getWs(supabase, args.executionId)) ?? "",
    status: args.status === "success" || args.status === "simulated" ? args.status : "failed",
    started_at: args.startedAt.toISOString(),
    completed_at: completed.toISOString(),
    message: args.logMessage ?? args.error ?? null,
    execution_time_ms: ms,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  // Update flow run counters
  if (args.status === "success" || args.status === "simulated") {
    // increment run_count and stamp last_run_at
    const { data: flow } = await supabase
      .from("flows")
      .select("run_count")
      .eq("id", args.flowId)
      .maybeSingle();
    const next = (flow?.run_count ?? 0) + 1;
    await supabase
      .from("flows")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ run_count: next, last_run_at: completed.toISOString() } as any)
      .eq("id", args.flowId);
  }
}

async function getWs(supabase: SB, executionId: string): Promise<string | null> {
  const { data } = await supabase
    .from("flow_executions")
    .select("workspace_id")
    .eq("id", executionId)
    .maybeSingle();
  return (data?.workspace_id as string | undefined) ?? null;
}
