import { supabase } from "@/integrations/supabase/client";
import { WHATSAPP_BACKEND_TOKEN, WHATSAPP_BACKEND_URL } from "./config";

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");
  return token;
}

async function call<T>(path: string, workspaceId: string, init?: RequestInit): Promise<T> {
  if (!WHATSAPP_BACKEND_URL) throw new Error("WhatsApp backend URL not configured");
  const token = await getAccessToken();
  const res = await fetch(`${WHATSAPP_BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-mywa-token": WHATSAPP_BACKEND_TOKEN,
      "x-workspace-id": workspaceId,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`WhatsApp backend ${res.status}: ${body || res.statusText}`);
  }
  return (await res.json()) as T;
}

export interface SendMessagePayload {
  conversationId: string;
  messageId?: string;
  text?: string;
  mediaId?: string;
  replyToWaMessageId?: string | null;
}

export const waApi = {
  status: (workspaceId: string) => call<{ session: unknown }>("/api/whatsapp/status", workspaceId),
  connect: (workspaceId: string) =>
    call<{ ok: true }>("/api/whatsapp/connect", workspaceId, { method: "POST" }),
  disconnect: (workspaceId: string) =>
    call<{ ok: true }>("/api/whatsapp/disconnect", workspaceId, { method: "POST" }),
  reconnect: (workspaceId: string) =>
    call<{ ok: true }>("/api/whatsapp/reconnect", workspaceId, { method: "POST" }),
  qr: (workspaceId: string) =>
    call<{ qr: string | null; expiresAt: string | null }>("/api/whatsapp/qr", workspaceId),
  syncStatus: (workspaceId: string) =>
    call<{ sync: unknown }>("/api/whatsapp/sync/status", workspaceId),
  triggerSync: (workspaceId: string) =>
    call<{ ok: true }>("/api/whatsapp/sync/trigger", workspaceId, { method: "POST" }),
  sendMessage: (workspaceId: string, payload: SendMessagePayload) =>
    call<{ ok: true; waMessageId: string }>("/api/whatsapp/messages", workspaceId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
