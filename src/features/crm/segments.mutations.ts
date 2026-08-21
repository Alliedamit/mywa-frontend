import { supabase } from "@/integrations/supabase/client";
import type { SegmentFormParsed } from "./validation";
import type { SegmentGroup } from "./types";

export async function createSegment(
  workspaceId: string,
  values: SegmentFormParsed,
  rules: SegmentGroup,
  createdBy: string | null,
) {
  const { error, data } = await supabase
    .from("segments")
    .insert({
      workspace_id: workspaceId,
      name: values.name,
      description: values.description ?? null,
      rules: rules as unknown as never,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function updateSegment(id: string, values: SegmentFormParsed, rules: SegmentGroup) {
  const { error } = await supabase
    .from("segments")
    .update({
      name: values.name,
      description: values.description ?? null,
      rules: rules as unknown as never,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSegment(id: string) {
  const { error } = await supabase.from("segments").delete().eq("id", id);
  if (error) throw error;
}
