import { createFileRoute } from "@tanstack/react-router";

/**
 * Automation event webhook — called by the WhatsApp backend when a
 * message is received or sent. Bridges the backend message events
 * into the frontend automation engine's `emitEvent`.
 *
 * Auth: `x-mywa-token` header must match WHATSAPP_BACKEND_TOKEN.
 *
 * Body: { type, workspaceId, payload }
 */
export const Route = createFileRoute("/api/public/hooks/automation-event")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const token = request.headers.get("x-mywa-token");
        const expected =
          process.env.WHATSAPP_BACKEND_TOKEN ||
          process.env.VITE_WHATSAPP_BACKEND_TOKEN ||
          "mywa_prod_2026_4hG7Kp9LmX82Qa";
        if (!expected || token !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        try {
          const body = await request.json();
          const { type, workspaceId, payload } = body as {
            type: string;
            workspaceId: string;
            payload: Record<string, unknown>;
          };

          if (!type || !workspaceId) {
            return Response.json(
              { ok: false, error: "type and workspaceId required" },
              { status: 400 },
            );
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { emitEvent } = await import("@/features/automation/engine");
          type AutomationEventType =
            import("@/features/automation/engine/types").AutomationEventType;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await emitEvent(supabaseAdmin as any, {
            type: type as AutomationEventType,
            workspaceId,
            payload,
            occurredAt: new Date().toISOString(),
          });

          return Response.json({ ok: true, ...result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[automation-event]", msg);
          return Response.json({ ok: false, error: msg }, { status: 500 });
        }
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);
