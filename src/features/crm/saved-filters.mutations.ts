import { supabase } from "@/integrations/supabase/client";
import type { SavedFilterModule } from "./types";

export async function createSavedFilter(args: {
  workspaceId: string;
  module: SavedFilterModule;
  name: string;
  filters: Record<string, unknown>;
  createdBy: string | null;
}) {
  const { error, data } = await supabase
    .from("saved_filters")
    .insert({
      workspace_id: args.workspaceId,
      module: args.module,
      name: args.name,
      filters: args.filters as unknown as never,
      created_by: args.createdBy,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function renameSavedFilter(id: string, name: string) {
  const { error } = await supabase.from("saved_filters").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteSavedFilter(id: string) {
  const { error } = await supabase.from("saved_filters").delete().eq("id", id);
  if (error) throw error;
}
