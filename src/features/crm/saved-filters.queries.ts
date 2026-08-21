import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SavedFilterModule, SavedFilterRow } from "./types";

const sel = (s: string): string => s;

export function savedFiltersQueryOptions(workspaceId: string, module: SavedFilterModule) {
  return queryOptions({
    queryKey: ["saved-filters", workspaceId, module],
    queryFn: async (): Promise<SavedFilterRow[]> => {
      const { data, error } = await supabase
        .from("saved_filters")
        .select(sel("id, workspace_id, module, name, filters, created_by, created_at, updated_at"))
        .eq("workspace_id", workspaceId)
        .eq("module", module)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data as unknown as SavedFilterRow[]) ?? [];
    },
  });
}
