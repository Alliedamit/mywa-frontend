import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { AutomationEvent, ExecutionResult, RunEventResult, EngineFlow } from "./types";
import { findMatchingFlows } from "./trigger-manager";
import { evaluate } from "./condition-engine";
import { resolveActions, WHATSAPP_DEPENDENT_ACTIONS } from "./action-resolver";
import { enqueueActions, claimPending } from "./queue";
import { executeAction, type QueueRow } from "./executor";
import { createExecution, completeExecution } from "./logger";

type SB = SupabaseClient<Database>;

/**
 * Event Bus — single entry point. Fan-out to matching flows, evaluate,
 * enqueue, and run inline what we can. Never throws.
 */
export async function emitEvent(supabase: SB, event: AutomationEvent): Promise<RunEventResult> {
  const flows = await findMatchingFlows(supabase, event);
  const executions: ExecutionResult[] = [];

  for (const flow of flows) {
    // Isolate: one flow's failure must never stop siblings
    try {
      const result = await runFlow(supabase, flow, event);
      executions.push(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[engine.emitEvent] flow crashed", flow.id, msg);
      executions.push({
        flowId: flow.id,
        executionId: "",
        matched: false,
        actionsQueued: 0,
        actionsExecuted: 0,
        actionsWaiting: 0,
        actionsFailed: 0,
        error: msg,
      });
    }
  }

  return { matchedFlows: flows.length, executions };
}

async function runFlow(
  supabase: SB,
  flow: EngineFlow,
  event: AutomationEvent,
): Promise<ExecutionResult> {
  const startedAt = new Date();
  const executionId = await createExecution(supabase, {
    workspaceId: event.workspaceId,
    flowId: flow.id,
    triggerType: event.type,
    triggerPayload: event.payload as Record<string, unknown>,
    isTest: event.isTest,
  });

  if (!executionId) {
    return {
      flowId: flow.id,
      executionId: "",
      matched: false,
      actionsQueued: 0,
      actionsExecuted: 0,
      actionsWaiting: 0,
      actionsFailed: 0,
      error: "Failed to create execution",
    };
  }

  const cond = evaluate(flow.conditions, event.payload);
  if (!cond.passed) {
    await completeExecution(supabase, {
      executionId,
      flowId: flow.id,
      status: "skipped",
      matched: false,
      startedAt,
      logMessage: "Conditions did not match.",
    });
    return {
      flowId: flow.id,
      executionId,
      matched: false,
      actionsQueued: 0,
      actionsExecuted: 0,
      actionsWaiting: 0,
      actionsFailed: 0,
    };
  }

  const resolved = resolveActions(flow.actions, event);
  const enqueued = await enqueueActions({
    supabase,
    workspaceId: event.workspaceId,
    flowId: flow.id,
    flowExecutionId: executionId,
    actions: resolved,
    isTest: event.isTest,
  });

  const waiting = enqueued.filter((r) =>
    WHATSAPP_DEPENDENT_ACTIONS.has(r.action_type as string),
  ).length;

  // Inline-execute non-WhatsApp pending items belonging to this execution
  let executed = 0;
  let failed = 0;
  const { data: pending } = await supabase
    .from("automation_queue")
    .select("*")
    .eq("flow_execution_id", executionId)
    .eq("status", "pending");
  for (const row of (pending ?? []) as unknown as QueueRow[]) {
    const before = row.status;
    try {
      await executeAction(supabase, row);
      // Re-read status
      const { data: after } = await supabase
        .from("automation_queue")
        .select("status")
        .eq("id", row.id)
        .maybeSingle();
      if (after?.status === "completed") executed += 1;
      else if (after?.status === "failed") failed += 1;
    } catch (e) {
      console.error("[engine.runFlow] execute", before, e);
      failed += 1;
    }
  }

  const finalStatus = event.isTest
    ? "simulated"
    : failed > 0 && executed === 0 && waiting === 0
      ? "failed"
      : "success";
  await completeExecution(supabase, {
    executionId,
    flowId: flow.id,
    status: finalStatus,
    matched: true,
    startedAt,
    logMessage: event.isTest
      ? `Simulated: ${resolved.length} action(s).`
      : `Executed ${executed}, waiting ${waiting}, failed ${failed}.`,
  });

  return {
    flowId: flow.id,
    executionId,
    matched: true,
    actionsQueued: enqueued.length,
    actionsExecuted: executed,
    actionsWaiting: waiting,
    actionsFailed: failed,
  };
}

/**
 * Drain the queue (called by cron tick). Processes pending non-waiting items
 * whose scheduled_for has arrived.
 */
export async function drainQueue(supabase: SB, limit = 50): Promise<{ processed: number }> {
  const claimed = await claimPending(supabase, limit);
  for (const row of claimed as unknown as QueueRow[]) {
    try {
      await executeAction(supabase, row);
    } catch (e) {
      console.error("[engine.drainQueue]", e);
    }
  }
  return { processed: claimed.length };
}
