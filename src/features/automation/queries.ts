import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FlowExecutionRow {
  id: string;
  workspace_id: string;
  flow_id: string;
  trigger_type: string;
  trigger_payload: Record<string, unknown>;
  status: string;
  matched_conditions: boolean;
  started_at: string;
  completed_at: string | null;
  execution_time_ms: number | null;
  error_message: string | null;
  is_test: boolean;
  created_at: string;
}

export interface AutomationQueueRow {
  id: string;
  workspace_id: string;
  flow_execution_id: string;
  flow_id: string;
  action_type: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  max_attempts: number;
  scheduled_for: string;
  executed_at: string | null;
  last_error: string | null;
  is_test: boolean;
  created_at: string;
  updated_at: string;
}

export function flowExecutionsQueryOptions(flowId: string | undefined, limit = 25) {
  return queryOptions({
    queryKey: ["flow-executions", flowId ?? "", limit],
    enabled: Boolean(flowId),
    queryFn: async (): Promise<FlowExecutionRow[]> => {
      if (!flowId) return [];
      const { data, error } = await supabase
        .from("flow_executions")
        .select("*")
        .eq("flow_id", flowId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as FlowExecutionRow[];
    },
  });
}

export function executionQueueQueryOptions(executionId: string | undefined) {
  return queryOptions({
    queryKey: ["automation-queue", executionId ?? ""],
    enabled: Boolean(executionId),
    queryFn: async (): Promise<AutomationQueueRow[]> => {
      if (!executionId) return [];
      const { data, error } = await supabase
        .from("automation_queue")
        .select("*")
        .eq("flow_execution_id", executionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as AutomationQueueRow[];
    },
  });
}
