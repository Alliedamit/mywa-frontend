import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useWhatsAppRealtime(workspaceId: string | null | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!workspaceId) return;
    const channel = supabase
      .channel(`whatsapp:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_sessions",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["whatsapp-session", workspaceId] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_sync_state",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["whatsapp-sync-state", workspaceId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, qc]);
}
