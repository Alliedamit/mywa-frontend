import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SegmentGroup, SegmentRow } from "./types";

const sel = (s: string): string => s;

export function segmentsQueryOptions(workspaceId: string, q = "") {
  return queryOptions({
    queryKey: ["segments", workspaceId, { q }],
    queryFn: async (): Promise<SegmentRow[]> => {
      let query = supabase
        .from("segments")
        .select(sel("id, workspace_id, name, description, rules, created_at, updated_at"))
        .eq("workspace_id", workspaceId)
        .order("updated_at", { ascending: false });
      if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
      type Raw = Omit<SegmentRow, "rules"> & { rules: unknown };
      const { data, error } = await query.returns<Raw[]>();
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        rules: (r.rules as SegmentGroup) ?? { combinator: "and", rules: [] },
      }));
    },
  });
}
