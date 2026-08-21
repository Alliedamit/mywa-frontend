
CREATE TABLE public.flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','archived')),
  run_count INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX flows_workspace_idx ON public.flows(workspace_id);
CREATE INDEX flows_status_idx ON public.flows(workspace_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flows TO authenticated;
GRANT ALL ON public.flows TO service_role;

ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flows_select" ON public.flows FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "flows_insert" ON public.flows FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "flows_update" ON public.flows FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "flows_delete" ON public.flows FOR DELETE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER flows_set_updated_at BEFORE UPDATE ON public.flows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.flow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success','failed','simulated')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX flow_logs_flow_idx ON public.flow_logs(flow_id, created_at DESC);
CREATE INDEX flow_logs_workspace_idx ON public.flow_logs(workspace_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flow_logs TO authenticated;
GRANT ALL ON public.flow_logs TO service_role;

ALTER TABLE public.flow_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flow_logs_select" ON public.flow_logs FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "flow_logs_insert" ON public.flow_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "flow_logs_update" ON public.flow_logs FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "flow_logs_delete" ON public.flow_logs FOR DELETE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
