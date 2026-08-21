GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_workspace_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_workspace_role(uuid, uuid, public.workspace_role[]) TO authenticated;