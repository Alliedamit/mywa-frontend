import { supabase } from "@/integrations/supabase/client";
import type { FlowFormParsed } from "./validation";
import type { FlowRow, FlowStatus } from "./types";

import type { Database } from "@/integrations/supabase/types";

type FlowInsert = Database["public"]["Tables"]["flows"]["Insert"];
type FlowUpdate = Database["public"]["Tables"]["flows"]["Update"];

function payload(values: FlowFormParsed) {
  return {
    name: values.name,
    description: values.description || null,
    trigger: values.trigger,
    conditions: values.conditions,
    actions: values.actions,
    status: values.status,
  };
}

export async function createFlow(args: {
  workspaceId: string;
  userId: string | null;
  values: FlowFormParsed;
}) {
  const { data, error } = await supabase
    .from("flows")
    .insert({
      workspace_id: args.workspaceId,
      created_by: args.userId,
      ...payload(args.values),
    } as unknown as FlowInsert)
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function updateFlow(id: string, values: FlowFormParsed) {
  const { error } = await supabase
    .from("flows")
    .update(payload(values) as unknown as FlowUpdate)
    .eq("id", id);
  if (error) throw error;
}

export async function setFlowStatus(id: string, status: FlowStatus) {
  const patch: Record<string, unknown> = { status };
  if (status === "archived") patch.archived_at = new Date().toISOString();
  else patch.archived_at = null;

  const { error } = await supabase
    .from("flows")
    .update(patch as unknown as FlowUpdate)
    .eq("id", id);
  if (error) throw error;
}

export async function duplicateFlow(row: FlowRow) {
  const { error } = await supabase.from("flows").insert({
    workspace_id: row.workspace_id,
    created_by: row.created_by,
    name: `${row.name} (copy)`,
    description: row.description,
    trigger: row.trigger,
    conditions: row.conditions,
    actions: row.actions,
    status: "draft",
  } as unknown as FlowInsert);
  if (error) throw error;
}

export async function archiveFlow(id: string) {
  await setFlowStatus(id, "archived");
}

export async function simulateFlow(args: {
  flow: FlowRow;
  passed: boolean;
  message: string;
  executionMs: number;
}) {
  const now = new Date();
  const started = new Date(now.getTime() - args.executionMs).toISOString();
  const completed = now.toISOString();

  const { error: logErr } = await supabase.from("flow_logs").insert({
    flow_id: args.flow.id,
    workspace_id: args.flow.workspace_id,
    status: args.passed ? "simulated" : "failed",
    started_at: started,
    completed_at: completed,
    message: args.message,
    execution_time_ms: args.executionMs,
  } as unknown as Database["public"]["Tables"]["flow_logs"]["Insert"]);
  if (logErr) throw logErr;

  const { error: updErr } = await supabase
    .from("flows")
    .update({
      run_count: (args.flow.run_count ?? 0) + 1,
      last_run_at: completed,
    } as unknown as FlowUpdate)
    .eq("id", args.flow.id);
  if (updErr) throw updErr;
}
