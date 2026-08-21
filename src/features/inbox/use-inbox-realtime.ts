import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useInboxRealtime(workspaceId: string | null | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!workspaceId) return;
    const channel = supabase
      .channel(`inbox:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["conversations"] });
          qc.invalidateQueries({ queryKey: ["conversation"] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const conv =
            (payload.new as { conversation_id?: string } | null)?.conversation_id ??
            (payload.old as { conversation_id?: string } | null)?.conversation_id;
          if (conv) qc.invalidateQueries({ queryKey: ["messages", conv] });
          qc.invalidateQueries({ queryKey: ["conversations"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, qc]);
}
