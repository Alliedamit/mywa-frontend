import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ConversationWithContact, InboxFilter, MessageWithAttachments } from "./types";

interface ListArgs {
  workspaceId: string | null | undefined;
  filter: InboxFilter;
  search: string;
  currentUserId?: string | null;
}

const CONTACT_SEL =
  "id, first_name, last_name, display_name, whatsapp_number, email, designation, company:companies(id, company_name), contact_tags(tag:tags(id, name, color))";

export function conversationsQueryOptions(args: ListArgs) {
  const { workspaceId, filter, search, currentUserId } = args;
  return queryOptions({
    queryKey: ["conversations", workspaceId, filter, search, currentUserId ?? null],
    enabled: Boolean(workspaceId),
    queryFn: async (): Promise<ConversationWithContact[]> => {
      if (!workspaceId) return [];
      let q = supabase
        .from("conversations")
        .select(`*, contact:contacts(${CONTACT_SEL})`)
        .eq("workspace_id", workspaceId);

      if (filter === "archived") q = q.eq("is_archived", true);
      else q = q.eq("is_archived", false);

      if (filter === "unread") q = q.gt("unread_count", 0);
      if (filter === "pinned") q = q.eq("is_pinned", true);
      if (filter === "assigned" && currentUserId) q = q.eq("assigned_user_id", currentUserId);

      q = q
        .order("is_pinned", { ascending: false })
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(200);

      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as unknown as ConversationWithContact[];
      if (!search.trim()) return rows;
      const s = search.trim().toLowerCase();
      return rows.filter((c) => {
        const name = [c.contact?.first_name, c.contact?.last_name, c.contact?.display_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const num = c.contact?.whatsapp_number?.toLowerCase() ?? "";
        const preview = c.last_message_preview?.toLowerCase() ?? "";
        return name.includes(s) || num.includes(s) || preview.includes(s);
      });
    },
  });
}

export function conversationQueryOptions(conversationId: string | null | undefined) {
  return queryOptions({
    queryKey: ["conversation", conversationId],
    enabled: Boolean(conversationId),
    queryFn: async (): Promise<ConversationWithContact | null> => {
      if (!conversationId) return null;
      const { data, error } = await supabase
        .from("conversations")
        .select(`*, contact:contacts(${CONTACT_SEL})`)
        .eq("id", conversationId)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as ConversationWithContact | null) ?? null;
    },
  });
}

export function messagesQueryOptions(conversationId: string | null | undefined) {
  return queryOptions({
    queryKey: ["messages", conversationId],
    enabled: Boolean(conversationId),
    queryFn: async (): Promise<MessageWithAttachments[]> => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*, attachments:message_attachments(*)")
        .eq("conversation_id", conversationId)
        .order("sent_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data as unknown as MessageWithAttachments[]) ?? [];
    },
  });
}
