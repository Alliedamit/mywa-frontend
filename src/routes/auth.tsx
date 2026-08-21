import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    // Only redirect away when we're on the login screen itself,
    // not on /auth/reset-password or /auth/forgot-password.
    if (data.session && location.pathname === "/auth") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_45%_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_70%)]"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background text-sm font-bold shadow-sm">
            M
          </div>
          <span className="text-lg font-semibold tracking-tight">MyWA</span>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <Outlet />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} MyWA. All rights reserved.
        </p>
      </div>
    </div>
  );
}
