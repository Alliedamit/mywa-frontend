
-- ============================================================
-- MEDIA LIBRARY
-- ============================================================

CREATE TYPE public.media_file_type AS ENUM ('image', 'pdf', 'document', 'video', 'audio');

CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type public.media_file_type NOT NULL,
  mime_type TEXT NOT NULL,
  category TEXT,
  description TEXT,
  file_size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  content_hash TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT media_storage_path_unique UNIQUE (storage_path)
);

CREATE INDEX media_ws_created_idx ON public.media (workspace_id, created_at DESC);
CREATE INDEX media_ws_last_used_idx ON public.media (workspace_id, last_used_at DESC NULLS LAST);
CREATE INDEX media_ws_fav_idx ON public.media (workspace_id, is_favorite);
CREATE INDEX media_ws_type_idx ON public.media (workspace_id, file_type);
CREATE UNIQUE INDEX media_ws_filename_size_idx
  ON public.media (workspace_id, lower(original_filename), file_size);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT ALL ON public.media TO service_role;

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_select_ws"
  ON public.media FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "media_insert_ws"
  ON public.media FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "media_update_ws"
  ON public.media FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "media_delete_ws"
  ON public.media FOR DELETE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER media_set_updated_at
  BEFORE UPDATE ON public.media
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TEMPLATE ATTACHMENTS
-- ============================================================

CREATE TABLE public.template_media (
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (template_id, media_id)
);

CREATE INDEX template_media_media_idx ON public.template_media (media_id);
CREATE INDEX template_media_tpl_pos_idx ON public.template_media (template_id, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_media TO authenticated;
GRANT ALL ON public.template_media TO service_role;

ALTER TABLE public.template_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "template_media_select_ws"
  ON public.template_media FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.templates t
    WHERE t.id = template_media.template_id
      AND public.is_workspace_member(auth.uid(), t.workspace_id)
  ));

CREATE POLICY "template_media_insert_ws"
  ON public.template_media FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.templates t
    WHERE t.id = template_media.template_id
      AND public.is_workspace_member(auth.uid(), t.workspace_id)
  ));

CREATE POLICY "template_media_update_ws"
  ON public.template_media FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.templates t
    WHERE t.id = template_media.template_id
      AND public.is_workspace_member(auth.uid(), t.workspace_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.templates t
    WHERE t.id = template_media.template_id
      AND public.is_workspace_member(auth.uid(), t.workspace_id)
  ));

CREATE POLICY "template_media_delete_ws"
  ON public.template_media FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.templates t
    WHERE t.id = template_media.template_id
      AND public.is_workspace_member(auth.uid(), t.workspace_id)
  ));

-- ============================================================
-- MESSAGE MEDIA (save-to-library link)
-- ============================================================

CREATE TABLE public.message_media (
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, media_id)
);

CREATE INDEX message_media_media_idx ON public.message_media (media_id);

GRANT SELECT, INSERT, DELETE ON public.message_media TO authenticated;
GRANT ALL ON public.message_media TO service_role;

ALTER TABLE public.message_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_media_select_ws"
  ON public.message_media FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_media.message_id
      AND public.is_workspace_member(auth.uid(), m.workspace_id)
  ));

CREATE POLICY "message_media_insert_ws"
  ON public.message_media FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_media.message_id
      AND public.is_workspace_member(auth.uid(), m.workspace_id)
  ));

CREATE POLICY "message_media_delete_ws"
  ON public.message_media FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_media.message_id
      AND public.is_workspace_member(auth.uid(), m.workspace_id)
  ));

-- ============================================================
-- STORAGE POLICIES for the `media` bucket
-- (bucket itself is created via the storage tool)
-- Path convention: {workspace_id}/{folder}/{filename}
-- ============================================================

CREATE POLICY "media_bucket_select_ws"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'media'
    AND public.is_workspace_member(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "media_bucket_insert_ws"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND public.is_workspace_member(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "media_bucket_update_ws"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'media'
    AND public.is_workspace_member(auth.uid(), (storage.foldername(name))[1]::uuid)
  )
  WITH CHECK (
    bucket_id = 'media'
    AND public.is_workspace_member(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "media_bucket_delete_ws"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND public.is_workspace_member(auth.uid(), (storage.foldername(name))[1]::uuid)
  );
