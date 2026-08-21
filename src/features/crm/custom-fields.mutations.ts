import { supabase } from "@/integrations/supabase/client";
import { parseChoices, type CustomFieldFormParsed } from "./validation";

export async function createCustomField(workspaceId: string, values: CustomFieldFormParsed) {
  const options: Record<string, unknown> = {};
  if (values.type === "dropdown") options.choices = parseChoices(values.choices);
  if (values.type === "currency") options.currency = values.currency || "USD";
  const { error } = await supabase.from("custom_fields").insert({
    workspace_id: workspaceId,
    module: values.module,
    name: values.name,
    type: values.type,
    options: options as unknown as never,
  });
  if (error) {
    if (error.code === "23505") throw new Error("A field with this name already exists.");
    throw error;
  }
}

export async function updateCustomField(id: string, values: CustomFieldFormParsed) {
  const options: Record<string, unknown> = {};
  if (values.type === "dropdown") options.choices = parseChoices(values.choices);
  if (values.type === "currency") options.currency = values.currency || "USD";
  const { error } = await supabase
    .from("custom_fields")
    .update({
      name: values.name,
      type: values.type,
      options: options as unknown as never,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCustomField(id: string) {
  const { error } = await supabase.from("custom_fields").delete().eq("id", id);
  if (error) throw error;
}
