export type ChannelType = "whatsapp" | "sms" | "email" | "internal";
export type ConversationStatus = "open" | "pending" | "resolved" | "closed";
export type MessageSenderType = "contact" | "user" | "system" | "bot";
export type MessageDirection = "inbound" | "outbound";
export type MessageType =
  "text" | "image" | "video" | "document" | "audio" | "sticker" | "location" | "system";
export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";

export type InboxFilter = "all" | "unread" | "assigned" | "archived" | "pinned";

export interface ConversationRow {
  id: string;
  workspace_id: string;
  contact_id: string;
  channel: ChannelType;
  status: ConversationStatus;
  assigned_user_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  is_archived: boolean;
  is_muted: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationContactRef {
  id: string;
  first_name: string;
  last_name: string | null;
  display_name: string | null;
  whatsapp_number: string;
  email: string | null;
  designation: string | null;
  company: { id: string; company_name: string } | null;
  contact_tags?: { tag: { id: string; name: string; color: string } | null }[];
}

export interface ConversationWithContact extends ConversationRow {
  contact: ConversationContactRef | null;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  workspace_id: string;
  sender_type: MessageSenderType;
  sender_user_id: string | null;
  direction: MessageDirection;
  message_type: MessageType;
  text: string | null;
  reply_to_message_id: string | null;
  status: MessageStatus;
  sent_at: string;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  storage_path: string | null;
  thumbnail_path: string | null;
  created_at: string;
}

export interface MessageWithAttachments extends MessageRow {
  attachments: MessageAttachment[];
  reply_to?: Pick<MessageRow, "id" | "text" | "message_type" | "sender_type"> | null;
}

export function contactDisplay(c: ConversationContactRef | null): string {
  if (!c) return "Unknown";
  if (c.display_name) return c.display_name;
  return [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || c.whatsapp_number;
}

export function contactInitials(c: ConversationContactRef | null): string {
  if (!c) return "?";
  const first = c.first_name?.[0] ?? "";
  const last = c.last_name?.[0] ?? "";
  return (first + last || first || "?").toUpperCase();
}
