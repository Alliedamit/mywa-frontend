CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_workspace_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.workspace_members WHERE user_id=_user_id AND workspace_id=_workspace_id); $$;

CREATE OR REPLACE FUNCTION private.has_workspace_role(_user_id uuid, _workspace_id uuid, _roles public.workspace_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.workspace_members WHERE user_id=_user_id AND workspace_id=_workspace_id AND role = ANY(_roles)); $$;

REVOKE ALL ON FUNCTION private.is_workspace_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_workspace_role(uuid, uuid, public.workspace_role[]) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

DO $do$
DECLARE
  r RECORD;
  new_qual TEXT;
  new_check TEXT;
  stmt TEXT;
BEGIN
  FOR r IN
    SELECT p.schemaname, p.tablename, p.policyname, p.permissive, p.roles, p.cmd AS pcmd, p.qual, p.with_check
    FROM pg_policies p
    WHERE p.schemaname IN ('public','storage')
      AND (COALESCE(p.qual,'') LIKE '%is_workspace_member%'
        OR COALESCE(p.qual,'') LIKE '%has_workspace_role%'
        OR COALESCE(p.with_check,'') LIKE '%is_workspace_member%'
        OR COALESCE(p.with_check,'') LIKE '%has_workspace_role%')
  LOOP
    new_qual := COALESCE(r.qual,'');
    new_qual := replace(new_qual, 'public.is_workspace_member(', 'private.is_workspace_member(');
    new_qual := replace(new_qual, 'public.has_workspace_role(', 'private.has_workspace_role(');
    new_qual := regexp_replace(new_qual, '(?<![a-zA-Z0-9_.])is_workspace_member\(', 'private.is_workspace_member(', 'g');
    new_qual := regexp_replace(new_qual, '(?<![a-zA-Z0-9_.])has_workspace_role\(', 'private.has_workspace_role(', 'g');

    new_check := COALESCE(r.with_check,'');
    new_check := replace(new_check, 'public.is_workspace_member(', 'private.is_workspace_member(');
    new_check := replace(new_check, 'public.has_workspace_role(', 'private.has_workspace_role(');
    new_check := regexp_replace(new_check, '(?<![a-zA-Z0-9_.])is_workspace_member\(', 'private.is_workspace_member(', 'g');
    new_check := regexp_replace(new_check, '(?<![a-zA-Z0-9_.])has_workspace_role\(', 'private.has_workspace_role(', 'g');

    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);

    stmt := 'CREATE POLICY ' || quote_ident(r.policyname)
         || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename)
         || ' AS ' || r.permissive
         || ' FOR ' || r.pcmd
         || ' TO ' || array_to_string(r.roles, ', ');
    IF r.qual IS NOT NULL THEN
      stmt := stmt || ' USING (' || new_qual || ')';
    END IF;
    IF r.with_check IS NOT NULL THEN
      stmt := stmt || ' WITH CHECK (' || new_check || ')';
    END IF;
    EXECUTE stmt;
  END LOOP;
END
$do$;

DROP FUNCTION IF EXISTS public.is_workspace_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.has_workspace_role(uuid, uuid, public.workspace_role[]);