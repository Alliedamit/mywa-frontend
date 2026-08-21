-- Tags
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#64748b',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX tags_workspace_name_uniq ON public.tags (workspace_id, lower(name));
CREATE INDEX tags_workspace_id_idx ON public.tags (workspace_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_member_all" ON public.tags FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE TRIGGER tags_updated BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Contact tags junction
CREATE TABLE public.contact_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contact_id, tag_id)
);
CREATE INDEX contact_tags_contact_idx ON public.contact_tags (contact_id);
CREATE INDEX contact_tags_tag_idx ON public.contact_tags (tag_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_tags TO authenticated;
GRANT ALL ON public.contact_tags TO service_role;
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_tags_member_all" ON public.contact_tags FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND public.is_workspace_member(auth.uid(), c.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND public.is_workspace_member(auth.uid(), c.workspace_id)));

-- Segments
CREATE TABLE public.segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '{"combinator":"and","rules":[]}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX segments_workspace_id_idx ON public.segments (workspace_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.segments TO authenticated;
GRANT ALL ON public.segments TO service_role;
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "segments_member_all" ON public.segments FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE TRIGGER segments_updated BEFORE UPDATE ON public.segments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Notes
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notes_contact_idx ON public.notes (contact_id, created_at DESC);
CREATE INDEX notes_workspace_idx ON public.notes (workspace_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_member_select" ON public.notes FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "notes_member_insert" ON public.notes FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id) AND created_by = auth.uid());
CREATE POLICY "notes_own_delete" ON public.notes FOR DELETE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id) AND created_by = auth.uid());
CREATE POLICY "notes_own_update" ON public.notes FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id) AND created_by = auth.uid())
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id) AND created_by = auth.uid());

-- Custom fields framework
CREATE TABLE public.custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK (module IN ('contact','company')),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text','textarea','number','email','phone','date','checkbox','dropdown','currency')),
  options JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX custom_fields_workspace_module_name_uniq ON public.custom_fields (workspace_id, module, lower(name));
CREATE INDEX custom_fields_workspace_idx ON public.custom_fields (workspace_id, module);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_fields TO authenticated;
GRANT ALL ON public.custom_fields TO service_role;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_fields_member_all" ON public.custom_fields FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE TRIGGER custom_fields_updated BEFORE UPDATE ON public.custom_fields FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.custom_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  custom_field_id UUID NOT NULL REFERENCES public.custom_fields(id) ON DELETE CASCADE,
  record_id UUID NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (custom_field_id, record_id)
);
CREATE INDEX custom_field_values_record_idx ON public.custom_field_values (record_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_field_values TO authenticated;
GRANT ALL ON public.custom_field_values TO service_role;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_field_values_member_all" ON public.custom_field_values FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.custom_fields cf WHERE cf.id = custom_field_id AND public.is_workspace_member(auth.uid(), cf.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.custom_fields cf WHERE cf.id = custom_field_id AND public.is_workspace_member(auth.uid(), cf.workspace_id)));
CREATE TRIGGER custom_field_values_updated BEFORE UPDATE ON public.custom_field_values FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Saved filters
CREATE TABLE public.saved_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK (module IN ('contacts','companies')),
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX saved_filters_workspace_module_idx ON public.saved_filters (workspace_id, module);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_filters TO authenticated;
GRANT ALL ON public.saved_filters TO service_role;
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_filters_member_all" ON public.saved_filters FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE TRIGGER saved_filters_updated BEFORE UPDATE ON public.saved_filters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Contacts: archived_at for bulk archive
ALTER TABLE public.contacts ADD COLUMN archived_at TIMESTAMPTZ;
CREATE INDEX contacts_archived_at_idx ON public.contacts (archived_at);