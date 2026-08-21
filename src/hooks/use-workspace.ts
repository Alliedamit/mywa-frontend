import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentWorkspace {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "admin" | "member";
}

export function useCurrentWorkspace() {
  return useQuery({
    queryKey: ["current-workspace"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<CurrentWorkspace | null> => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(`Could not verify your session: ${userError.message}`);
      if (!userData.user) throw new Error("Your session has expired. Please sign in again.");

      const { data, error } = await supabase
        .from("workspace_members")
        .select("role, workspace:workspaces(id, name, slug)")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(`Could not load your workspace: ${error.message}`);
      if (!data?.workspace) return null;
      const ws = data.workspace as { id: string; name: string; slug: string };
      return { id: ws.id, name: ws.name, slug: ws.slug, role: data.role };
    },
  });
}
