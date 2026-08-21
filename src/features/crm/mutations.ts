import { supabase } from "@/integrations/supabase/client";
import type { ContactFormParsed, CompanyFormParsed } from "./validation";
import { normalizeWhatsapp } from "./validation";
import { emitAutomationEvent } from "@/features/automation/automation.functions";

export class DuplicateWhatsappError extends Error {
  constructor() {
    super("This WhatsApp number already exists in this workspace.");
    this.name = "DuplicateWhatsappError";
  }
}

interface CreateContactArgs {
  workspaceId: string;
  ownerUserId: string;
  values: ContactFormParsed;
}

export async function createContact({ workspaceId, ownerUserId, values }: CreateContactArgs) {
  const payload = {
    workspace_id: workspaceId,
    first_name: values.first_name,
    last_name: values.last_name ?? null,
    display_name: values.display_name ?? null,
    whatsapp_number: normalizeWhatsapp(values.whatsapp_number),
    email: values.email ?? null,
    company_id: values.company_id ?? null,
    designation: values.designation ?? null,
    owner_user_id: values.owner_user_id ?? ownerUserId,
  };
  const { data, error } = await supabase.from("contacts").insert(payload).select("id").single();
  if (error) {
    if (error.code === "23505") throw new DuplicateWhatsappError();
    throw error;
  }
  // Fire-and-forget: automation event
  void emitAutomationEvent({
    data: {
      type: "contact_added",
      workspaceId,
      payload: {
        contactId: data.id,
        text: `${values.first_name} ${values.last_name ?? ""}`.trim(),
      },
    },
  }).catch((e) => console.error("[automation] contact_added", e));
  return data;
}

interface UpdateContactArgs {
  id: string;
  values: ContactFormParsed;
}

export async function updateContact({ id, values }: UpdateContactArgs) {
  const payload = {
    first_name: values.first_name,
    last_name: values.last_name ?? null,
    display_name: values.display_name ?? null,
    whatsapp_number: normalizeWhatsapp(values.whatsapp_number),
    email: values.email ?? null,
    company_id: values.company_id ?? null,
    designation: values.designation ?? null,
    owner_user_id: values.owner_user_id ?? null,
  };
  const { error } = await supabase.from("contacts").update(payload).eq("id", id);
  if (error) {
    if (error.code === "23505") throw new DuplicateWhatsappError();
    throw error;
  }
}

export async function deleteContact(id: string) {
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw error;
}

export async function bulkDeleteContacts(ids: string[]) {
  if (ids.length === 0) return;
  const { error } = await supabase.from("contacts").delete().in("id", ids);
  if (error) throw error;
}

export async function bulkArchiveContacts(ids: string[], archived: boolean) {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("contacts")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .in("id", ids);
  if (error) throw error;
}

interface CreateCompanyArgs {
  workspaceId: string;
  values: CompanyFormParsed;
}

export async function createCompany({ workspaceId, values }: CreateCompanyArgs) {
  const payload = {
    workspace_id: workspaceId,
    company_name: values.company_name,
    phone: values.phone ?? null,
    email: values.email ?? null,
    website: values.website ?? null,
    industry: values.industry ?? null,
  };
  const { data, error } = await supabase
    .from("companies")
    .insert(payload)
    .select("id, company_name")
    .single();
  if (error) throw error;
  return data;
}

export async function updateCompany(id: string, values: CompanyFormParsed) {
  const payload = {
    company_name: values.company_name,
    phone: values.phone ?? null,
    email: values.email ?? null,
    website: values.website ?? null,
    industry: values.industry ?? null,
  };
  const { error } = await supabase.from("companies").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteCompany(id: string) {
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;
}
