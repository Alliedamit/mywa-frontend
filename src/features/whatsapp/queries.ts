import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { WhatsAppSession, WhatsAppSyncState } from "./types";

export function sessionQueryOptions(workspaceId: string | null | undefined) {
  return queryOptions({
    queryKey: ["whatsapp-session", workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async (): Promise<WhatsAppSession | null> => {
      if (!workspaceId) return null;
      const { data, error } = await supabase
        .from("whatsapp_sessions")
        .select("*")
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as WhatsAppSession | null) ?? null;
    },
  });
}

export function syncStateQueryOptions(workspaceId: string | null | undefined) {
  return queryOptions({
    queryKey: ["whatsapp-sync-state", workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async (): Promise<WhatsAppSyncState | null> => {
      if (!workspaceId) return null;
      const { data, error } = await supabase
        .from("whatsapp_sync_state")
        .select("*")
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as WhatsAppSyncState | null) ?? null;
    },
  });
}
