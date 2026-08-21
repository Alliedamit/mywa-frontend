
-- ============ whatsapp_sessions ============
CREATE TYPE public.whatsapp_status AS ENUM (
  'disconnected','connecting','qr_ready','connected','reconnecting','expired','failed'
);

CREATE TABLE public.whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  status public.whatsapp_status NOT NULL DEFAULT 'disconnected',
  wa_user_id TEXT,
  phone_number TEXT,
  profile_name TEXT,
  profile_picture_url TEXT,
  platform TEXT,
  connected_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  last_error TEXT,
  qr TEXT,
  qr_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.whatsapp_sessions TO authenticated;
GRANT ALL ON public.whatsapp_sessions TO service_role;

ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their workspace session"
  ON public.whatsapp_sessions FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER trg_wa_sessions_updated_at
  BEFORE UPDATE ON public.whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ whatsapp_sync_state ============
CREATE TYPE public.whatsapp_sync_phase AS ENUM (
  'idle','contacts','chats','messages','done','failed'
);

CREATE TABLE public.whatsapp_sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  phase public.whatsapp_sync_phase NOT NULL DEFAULT 'idle',
  processed INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.whatsapp_sync_state TO authenticated;
GRANT ALL ON public.whatsapp_sync_state TO service_role;

ALTER TABLE public.whatsapp_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their workspace sync state"
  ON public.whatsapp_sync_state FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER trg_wa_sync_state_updated_at
  BEFORE UPDATE ON public.whatsapp_sync_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Mapping columns on existing tables ============
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS wa_id TEXT,
  ADD COLUMN IF NOT EXISTS wa_is_group BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wa_synced_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS contacts_workspace_wa_id_uidx
  ON public.contacts(workspace_id, wa_id) WHERE wa_id IS NOT NULL;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS wa_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS wa_is_group BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wa_synced_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_workspace_wa_chat_uidx
  ON public.conversations(workspace_id, wa_chat_id) WHERE wa_chat_id IS NOT NULL;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS wa_message_id TEXT,
  ADD COLUMN IF NOT EXISTS wa_from_me BOOLEAN,
  ADD COLUMN IF NOT EXISTS wa_ack SMALLINT,
  ADD COLUMN IF NOT EXISTS wa_media_mime TEXT,
  ADD COLUMN IF NOT EXISTS wa_media_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS messages_workspace_wa_msg_uidx
  ON public.messages(workspace_id, wa_message_id) WHERE wa_message_id IS NOT NULL;

-- ============ Realtime ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_sync_state;
