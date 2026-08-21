import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { markCompleted, markFailed } from "./queue";

type SB = SupabaseClient<Database>;

export interface QueueRow {
  id: string;
  workspace_id: string;
  flow_execution_id: string;
  flow_id: string;
  action_type: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  max_attempts: number;
  is_test: boolean;
}

/**
 * Action Executor — dispatches a queue row to its handler.
 * Handlers are pure functions that receive the supabase client + row.
 * Test rows short-circuit (no side effects).
 */
export async function executeAction(supabase: SB, row: QueueRow): Promise<void> {
  try {
    if (row.is_test) {
      await markCompleted(supabase, row.id);
      return;
    }

    switch (row.action_type) {
      case "create_note":
        await handleCreateNote(supabase, row);
        break;
      case "add_tag":
        await handleAddTag(supabase, row);
        break;
      case "remove_tag":
        await handleRemoveTag(supabase, row);
        break;
      case "mark_favorite":
        await handleMarkFavorite(supabase, row);
        break;
      case "send_notification":
        // Internal notification — recorded only. No side effect other than being logged.
        break;
      case "insert_template":
      case "attach_media":
        // WhatsApp-dependent; should not be picked up here (status waiting_whatsapp),
        // but if it is, we mark it back as waiting.
        await supabase
          .from("automation_queue")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({ status: "waiting_whatsapp" } as any)
          .eq("id", row.id);
        return;
      default:
        throw new Error(`Unknown action_type: ${row.action_type}`);
    }
    await markCompleted(supabase, row.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[executor]", row.action_type, msg);
    await markFailed(supabase, row.id, row.attempts, row.max_attempts, msg);
  }
}

// ---- Handlers ----

async function handleCreateNote(supabase: SB, row: QueueRow) {
  const evt = (row.payload._event ?? {}) as { contactId?: string | null };
  const contactId = evt.contactId ?? (row.payload.contact_id as string | undefined);
  const text = String(row.payload.text ?? "");
  if (!contactId || !text) return; // nothing to do
  const { error } = await supabase.from("notes").insert({
    workspace_id: row.workspace_id,
    contact_id: contactId,
    note: text,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  if (error) throw error;
}

async function handleAddTag(supabase: SB, row: QueueRow) {
  const evt = (row.payload._event ?? {}) as { contactId?: string | null };
  const contactId = evt.contactId ?? (row.payload.contact_id as string | undefined);
  const tagName = String(row.payload.tag_name ?? "").trim();
  if (!contactId || !tagName) return;

  // Find or create tag by name in this workspace
  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .eq("workspace_id", row.workspace_id)
    .eq("name", tagName)
    .maybeSingle();
  let tagId = existing?.id as string | undefined;
  if (!tagId) {
    const { data: created, error } = await supabase
      .from("tags")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ workspace_id: row.workspace_id, name: tagName } as any)
      .select("id")
      .single();
    if (error) throw error;
    tagId = created.id;
  }
  const { error: linkErr } = await supabase
    .from("contact_tags")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({ contact_id: contactId, tag_id: tagId } as any, { onConflict: "contact_id,tag_id" });
  if (linkErr && linkErr.code !== "23505") throw linkErr;
}

async function handleRemoveTag(supabase: SB, row: QueueRow) {
  const evt = (row.payload._event ?? {}) as { contactId?: string | null };
  const contactId = evt.contactId ?? (row.payload.contact_id as string | undefined);
  const tagName = String(row.payload.tag_name ?? "").trim();
  if (!contactId || !tagName) return;
  const { data: tag } = await supabase
    .from("tags")
    .select("id")
    .eq("workspace_id", row.workspace_id)
    .eq("name", tagName)
    .maybeSingle();
  if (!tag?.id) return;
  await supabase.from("contact_tags").delete().eq("contact_id", contactId).eq("tag_id", tag.id);
}

async function handleMarkFavorite(supabase: SB, row: QueueRow) {
  const evt = (row.payload._event ?? {}) as { conversationId?: string | null };
  const conversationId = evt.conversationId ?? (row.payload.conversation_id as string | undefined);
  if (!conversationId) return;
  await supabase
    .from("conversations")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ is_pinned: true } as any)
    .eq("id", conversationId);
}
