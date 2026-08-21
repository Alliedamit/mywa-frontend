import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Building2, Loader2 } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { TopHeader } from "@/components/top-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext() as { user: User };
  const [profile, setProfile] = useState<Profile | null>(null);
  const workspace = useCurrentWorkspace();

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile((data as Profile | null) ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <TopHeader user={user} displayName={profile?.full_name} avatarUrl={profile?.avatar_url} />
          <main className="min-w-0 flex-1">
            {workspace.isLoading ? (
              <div
                className="flex min-h-[50vh] items-center justify-center"
                aria-label="Loading workspace"
              >
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : workspace.isError ? (
              <ErrorState
                title="Workspace couldn't load"
                description={workspace.error instanceof Error ? workspace.error.message : undefined}
                onRetry={() => void workspace.refetch()}
              />
            ) : !workspace.data ? (
              <EmptyState
                icon={Building2}
                title="No workspace assigned"
                description="Your account is signed in, but it is not assigned to a workspace. Ask an administrator to add you."
              />
            ) : (
              <Outlet />
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
