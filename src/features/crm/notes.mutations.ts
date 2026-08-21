import { supabase } from "@/integrations/supabase/client";

export async function createNote(args: {
  workspaceId: string;
  contactId: string;
  createdBy: string;
  note: string;
}) {
  const { error } = await supabase.from("notes").insert({
    workspace_id: args.workspaceId,
    contact_id: args.contactId,
    created_by: args.createdBy,
    note: args.note,
  });
  if (error) throw error;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}
