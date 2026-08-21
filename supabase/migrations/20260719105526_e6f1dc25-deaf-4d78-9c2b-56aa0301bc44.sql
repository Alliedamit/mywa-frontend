
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  shortcut TEXT,
  content TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT templates_name_length CHECK (char_length(name) BETWEEN 1 AND 80),
  CONSTRAINT templates_content_length CHECK (char_length(content) BETWEEN 1 AND 4000),
  CONSTRAINT templates_shortcut_format CHECK (shortcut IS NULL OR shortcut ~ '^[a-z0-9_-]{2,32}$')
);

CREATE UNIQUE INDEX templates_workspace_shortcut_uniq
  ON public.templates (workspace_id, shortcut)
  WHERE shortcut IS NOT NULL;

CREATE INDEX templates_workspace_favorite_idx
  ON public.templates (workspace_id, is_favorite);

CREATE INDEX templates_workspace_category_idx
  ON public.templates (workspace_id, category);

CREATE INDEX templates_workspace_updated_idx
  ON public.templates (workspace_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace templates"
  ON public.templates FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can insert workspace templates"
  ON public.templates FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update workspace templates"
  ON public.templates FOR UPDATE
  TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can delete workspace templates"
  ON public.templates FOR DELETE
  TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER templates_set_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
