import { supabase } from "@/integrations/supabase/client";
import type { TagFormParsed } from "./validation";

export async function createTag(workspaceId: string, values: TagFormParsed) {
  const { error, data } = await supabase
    .from("tags")
    .insert({
      workspace_id: workspaceId,
      name: values.name,
      color: values.color,
      description: values.description ?? null,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("A tag with this name already exists.");
    throw error;
  }
  return data;
}

export async function updateTag(id: string, values: TagFormParsed) {
  const { error } = await supabase
    .from("tags")
    .update({
      name: values.name,
      color: values.color,
      description: values.description ?? null,
    })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") throw new Error("A tag with this name already exists.");
    throw error;
  }
}

export async function deleteTag(id: string) {
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) throw error;
}

export async function assignTagsToContacts(contactIds: string[], tagIds: string[]) {
  if (contactIds.length === 0 || tagIds.length === 0) return;
  const rows = contactIds.flatMap((cid) => tagIds.map((tid) => ({ contact_id: cid, tag_id: tid })));
  const { error } = await supabase.from("contact_tags").upsert(rows, {
    onConflict: "contact_id,tag_id",
    ignoreDuplicates: true,
  });
  if (error) throw error;
}

export async function removeTagFromContact(contactId: string, tagId: string) {
  const { error } = await supabase
    .from("contact_tags")
    .delete()
    .eq("contact_id", contactId)
    .eq("tag_id", tagId);
  if (error) throw error;
}
