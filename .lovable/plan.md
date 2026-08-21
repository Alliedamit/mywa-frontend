## Diagnosis
The workspace is present and correctly linked to `a@a.com` as an owner. The failure is caused by the latest RLS hardening migration: workspace policies call `private.is_workspace_member(...)`, but the `authenticated` database role has neither `USAGE` on the `private` schema nor `EXECUTE` on that function. The browser query therefore fails instead of returning the existing workspace.

## Fix
1. Add one new, non-destructive migration that grants `authenticated` only the minimum permissions required to evaluate the private RLS helper functions:
   - `USAGE` on schema `private`
   - `EXECUTE` on `private.is_workspace_member(...)`
   - `EXECUTE` on `private.has_workspace_role(...)`
   These functions remain inaccessible through the public Data API because the schema is private; the grants only allow PostgreSQL to evaluate existing RLS policies for signed-in users.
2. Update `useCurrentWorkspace()` to preserve and expose database-query errors rather than collapsing every failure into a misleading null workspace state.
3. Update the affected workspace-dependent screen state to distinguish loading, query failure, and a genuinely missing membership, with a retry action.
4. Verify as the signed-in demo user that the workspace query returns `Demo User's Workspace`, then smoke-test a workspace-scoped page such as Integrations or Inbox.