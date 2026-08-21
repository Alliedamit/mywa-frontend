import { supabase } from "@/integrations/supabase/client";
import type { TemplateFormParsed } from "./validation";
import { extractVariables } from "./utils";

export class DuplicateShortcutError extends Error {
  constructor() {
    super("This shortcut is already used by another template.");
    this.name = "DuplicateShortcutError";
  }
}

function payload(values: TemplateFormParsed) {
  return {
    name: values.name,
    category: values.category,
    shortcut: values.shortcut ?? null,
    content: values.content,
    is_favorite: values.is_favorite ?? false,
    variables: extractVariables(values.content),
  };
}

export async function createTemplate(args: {
  workspaceId: string;
  userId: string;
  values: TemplateFormParsed;
}) {
  const { data, error } = await supabase
    .from("templates")
    .insert({
      workspace_id: args.workspaceId,
      created_by: args.userId,
      ...payload(args.values),
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") throw new DuplicateShortcutError();
    throw error;
  }
  return data;
}

export async function updateTemplate(id: string, values: TemplateFormParsed) {
  const { error } = await supabase.from("templates").update(payload(values)).eq("id", id);
  if (error) {
    if (error.code === "23505") throw new DuplicateShortcutError();
    throw error;
  }
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase.from("templates").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleTemplateFavorite(id: string, next: boolean) {
  const { error } = await supabase.from("templates").update({ is_favorite: next }).eq("id", id);
  if (error) throw error;
}

export async function duplicateTemplate(row: {
  workspace_id: string;
  name: string;
  category: string;
  content: string;
  is_favorite: boolean;
  created_by: string | null;
}) {
  const { error } = await supabase.from("templates").insert({
    workspace_id: row.workspace_id,
    created_by: row.created_by,
    name: `${row.name} (copy)`,
    category: row.category,
    shortcut: null,
    content: row.content,
    is_favorite: false,
    variables: extractVariables(row.content),
  });
  if (error) throw error;
}
