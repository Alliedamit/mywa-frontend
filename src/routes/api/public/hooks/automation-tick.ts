import { createFileRoute } from "@tanstack/react-router";

/**
 * Automation queue tick — called by pg_cron or external scheduler.
 *
 * 1. Drains pending non-WhatsApp queue items (existing behavior).
 * 2. Emits `scheduled_time` events for active flows using that trigger,
 *    so time-based reminders are evaluated and enqueued.
 *
 * Auth: apikey header must match the Supabase publishable key.
 */
export const Route = createFileRoute("/api/public/hooks/automation-tick")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const apiKey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apiKey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { drainQueue, emitEvent } = await import("@/features/automation/engine");

          // 1. Drain pending non-WhatsApp queue items
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const drainResult = await drainQueue(supabaseAdmin as any, 50);

          // 2. Fire scheduled_time events for all workspaces that have
          //    active flows with a scheduled_time trigger.
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
          const days = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ];
          const currentDay = days[now.getDay()];

          const { data: scheduledFlows } = await supabaseAdmin
            .from("flows")
            .select("workspace_id")
            .eq("trigger", "scheduled_time")
            .eq("status", "active");

          // Deduplicate by workspace_id
          const workspaceIds = [
            ...new Set((scheduledFlows ?? []).map((f: { workspace_id: string }) => f.workspace_id)),
          ];

          let scheduledMatches = 0;
          for (const wsId of workspaceIds) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const result = await emitEvent(supabaseAdmin as any, {
                type: "scheduled_time",
                workspaceId: wsId,
                payload: {
                  time: currentTime,
                  day: currentDay,
                },
                occurredAt: now.toISOString(),
              });
              scheduledMatches += result.matchedFlows;
            } catch (e) {
              console.error("[automation-tick] scheduled_time error for workspace", wsId, e);
            }
          }

          return Response.json({
            ok: true,
            ...drainResult,
            scheduledWorkspaces: workspaceIds.length,
            scheduledMatches,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[automation-tick]", msg);
          return Response.json({ ok: false, error: msg }, { status: 500 });
        }
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);
