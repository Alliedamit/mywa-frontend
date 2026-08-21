
-- flow_executions
CREATE TABLE public.flow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  trigger_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  matched_conditions BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  error_message TEXT,
  is_test BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_flow_executions_ws_created ON public.flow_executions(workspace_id, created_at DESC);
CREATE INDEX idx_flow_executions_flow_created ON public.flow_executions(flow_id, created_at DESC);

GRANT SELECT ON public.flow_executions TO authenticated;
GRANT ALL ON public.flow_executions TO service_role;

ALTER TABLE public.flow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view executions"
  ON public.flow_executions FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can insert executions"
  ON public.flow_executions FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can update executions"
  ON public.flow_executions FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- automation_queue
CREATE TABLE public.automation_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  flow_execution_id UUID NOT NULL REFERENCES public.flow_executions(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at TIMESTAMPTZ,
  last_error TEXT,
  is_test BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_queue_status_scheduled ON public.automation_queue(workspace_id, status, scheduled_for);
CREATE INDEX idx_queue_execution ON public.automation_queue(flow_execution_id);
CREATE INDEX idx_queue_pending ON public.automation_queue(status, scheduled_for) WHERE status = 'pending';

GRANT SELECT ON public.automation_queue TO authenticated;
GRANT ALL ON public.automation_queue TO service_role;

ALTER TABLE public.automation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view queue"
  ON public.automation_queue FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can insert queue"
  ON public.automation_queue FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can update queue"
  ON public.automation_queue FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER update_automation_queue_updated_at
  BEFORE UPDATE ON public.automation_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
