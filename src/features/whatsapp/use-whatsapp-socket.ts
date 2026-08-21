import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { supabase } from "@/integrations/supabase/client";
import { WHATSAPP_BACKEND_URL, isBackendConfigured } from "./config";

export function useWhatsAppSocket(workspaceId: string | null | undefined) {
  const qc = useQueryClient();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setToken(data.session?.access_token ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) setToken(session?.access_token ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!workspaceId || !isBackendConfigured() || !token) return;

    const socket: Socket = io(WHATSAPP_BACKEND_URL, {
      transports: ["polling", "websocket"],
      auth: {
        token: token || import.meta.env.VITE_WHATSAPP_BACKEND_TOKEN || "",
        workspaceId,
      },
      extraHeaders: import.meta.env.VITE_WHATSAPP_BACKEND_TOKEN
        ? { "x-mywa-token": import.meta.env.VITE_WHATSAPP_BACKEND_TOKEN }
        : undefined,
      reconnection: true,
      reconnectionDelay: 2000,
    });

    const invalidateSession = () =>
      qc.invalidateQueries({ queryKey: ["whatsapp-session", workspaceId] });
    const invalidateSync = () =>
      qc.invalidateQueries({ queryKey: ["whatsapp-sync-state", workspaceId] });
    const invalidateInbox = () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversation"] });
    };

    socket.on("qr.updated", invalidateSession);
    socket.on("connection.changed", invalidateSession);
    socket.on("sync.progress", invalidateSync);
    socket.on("conversation.updated", invalidateInbox);
    socket.on("contact.updated", () => qc.invalidateQueries({ queryKey: ["contacts"] }));
    socket.on("message.created", (payload: { conversationId?: string }) => {
      invalidateInbox();
      if (payload?.conversationId) {
        qc.invalidateQueries({ queryKey: ["messages", payload.conversationId] });
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [workspaceId, qc, token]);
}
