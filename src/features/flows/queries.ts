import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FlowLogRow, FlowRow, FlowStatus } from "./types";

export interface FlowsListParams {
  workspaceId: string;
  q?: string;
  status?: FlowStatus | "all";
}

export function flowsListQueryOptions(params: FlowsListParams) {
  const { workspaceId, q = "", status = "all" } = params;
  return queryOptions({
    queryKey: ["flows", workspaceId, { q, status }],
    enabled: Boolean(workspaceId),
    queryFn: async (): Promise<FlowRow[]> => {
      let query = supabase
        .from("flows")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("updated_at", { ascending: false });

      if (status === "all") {
        // hide archived by default when "all"
        query = query.neq("status", "archived");
      } else {
        query = query.eq("status", status);
      }
      if (q.trim()) {
        const like = `%${q.trim()}%`;
        query = query.or(`name.ilike.${like},description.ilike.${like},trigger.ilike.${like}`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as FlowRow[];
    },
  });
}

export function flowByIdQueryOptions(id: string | undefined) {
  return queryOptions({
    queryKey: ["flows", "detail", id ?? ""],
    enabled: Boolean(id),
    queryFn: async (): Promise<FlowRow | null> => {
      if (!id) return null;
      const { data, error } = await supabase.from("flows").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as FlowRow | null;
    },
  });
}

export function flowLogsQueryOptions(flowId: string | undefined, limit = 25) {
  return queryOptions({
    queryKey: ["flow-logs", flowId ?? "", limit],
    enabled: Boolean(flowId),
    queryFn: async (): Promise<FlowLogRow[]> => {
      if (!flowId) return [];
      const { data, error } = await supabase
        .from("flow_logs")
        .select("*")
        .eq("flow_id", flowId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as FlowLogRow[];
    },
  });
}
