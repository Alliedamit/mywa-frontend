export type WhatsAppStatus =
  "disconnected" | "connecting" | "qr_ready" | "connected" | "reconnecting" | "expired" | "failed";

export type SyncPhase = "idle" | "contacts" | "chats" | "messages" | "done" | "failed";

export interface WhatsAppSession {
  id: string;
  workspace_id: string;
  status: WhatsAppStatus;
  wa_user_id: string | null;
  phone_number: string | null;
  profile_name: string | null;
  profile_picture_url: string | null;
  platform: string | null;
  connected_at: string | null;
  last_seen_at: string | null;
  last_error: string | null;
  qr: string | null;
  qr_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppSyncState {
  id: string;
  workspace_id: string;
  phase: SyncPhase;
  processed: number;
  total: number;
  started_at: string | null;
  finished_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}
