
-- Trigger-only functions: no direct callers needed
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- RLS helpers: only signed-in users need to call them (policies do)
REVOKE ALL ON FUNCTION public.is_workspace_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_workspace_role(UUID, UUID, public.workspace_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_workspace_role(UUID, UUID, public.workspace_role[]) TO authenticated;
