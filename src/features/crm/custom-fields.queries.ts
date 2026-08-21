import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CustomFieldModule, CustomFieldRow } from "./types";

const sel = (s: string): string => s;

export function customFieldsQueryOptions(workspaceId: string, module: CustomFieldModule) {
  return queryOptions({
    queryKey: ["custom-fields", workspaceId, module],
    queryFn: async (): Promise<CustomFieldRow[]> => {
      const { data, error } = await supabase
        .from("custom_fields")
        .select(sel("id, workspace_id, module, name, type, options, created_at, updated_at"))
        .eq("workspace_id", workspaceId)
        .eq("module", module)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data as unknown as CustomFieldRow[]) ?? [];
    },
  });
}
