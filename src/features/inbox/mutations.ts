import { supabase } from "@/integrations/supabase/client";
import { waApi } from "@/features/whatsapp/client";
import { isBackendConfigured } from "@/features/whatsapp/config";

export interface SendMessageArgs {
  workspaceId: string;
  conversationId: string;
  text?: string;
  mediaId?: string;
  replyToWaMessageId?: string | null;
}

/**
 * Send an outbound WhatsApp message:
 * 1) Insert a pending message row (optimistic — realtime picks it up).
 * 2) Call backend to actually send via whatsapp-web.js.
 * 3) Backend updates the row with wa_message_id + status='sent';
 *    subsequent message_ack events transition to delivered/read.
 * If backend fails, the row is marked 'failed'.
 */
export async function sendWhatsAppMessage(args: SendMessageArgs): Promise<void> {
  if (!isBackendConfigured()) throw new Error("WhatsApp backend is not configured");
  const text = args.text?.trim() || undefined;
  if (!text && !args.mediaId) throw new Error("Message text or media required");

  // Derive message_type from media
  const messageType: "text" | "image" | "video" | "document" | "audio" = args.mediaId
    ? "document"
    : "text";

  const { data: inserted, error: insErr } = await supabase
    .from("messages")
    .insert({
      workspace_id: args.workspaceId,
      conversation_id: args.conversationId,
      direction: "outbound",
      sender_type: "user",
      message_type: messageType,
      text: text ?? null,
      status: "pending",
      sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (insErr) throw insErr;

  try {
    await waApi.sendMessage(args.workspaceId, {
      conversationId: args.conversationId,
      messageId: inserted.id,
      text,
      mediaId: args.mediaId,
      replyToWaMessageId: args.replyToWaMessageId ?? null,
    });
  } catch (err) {
    // Best-effort: mark failed so UI shows red status
    await supabase.from("messages").update({ status: "failed" }).eq("id", inserted.id);
    throw err;
  }

  // Update conversation preview + timestamp
  await supabase
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: text ?? "[media]",
    })
    .eq("id", args.conversationId);
}

export async function togglePin(id: string, next: boolean) {
  const { error } = await supabase.from("conversations").update({ is_pinned: next }).eq("id", id);
  if (error) throw error;
}
export async function toggleMute(id: string, next: boolean) {
  const { error } = await supabase.from("conversations").update({ is_muted: next }).eq("id", id);
  if (error) throw error;
}
export async function toggleArchive(id: string, next: boolean) {
  const { error } = await supabase.from("conversations").update({ is_archived: next }).eq("id", id);
  if (error) throw error;
}
export async function markRead(id: string) {
  const { error } = await supabase.from("conversations").update({ unread_count: 0 }).eq("id", id);
  if (error) throw error;
}
export async function assignConversation(id: string, userId: string | null) {
  const { error } = await supabase
    .from("conversations")
    .update({ assigned_user_id: userId })
    .eq("id", id);
  if (error) throw error;
}
export async function deleteConversation(id: string) {
  const { error } = await supabase.from("conversations").delete().eq("id", id);
  if (error) throw error;
}
