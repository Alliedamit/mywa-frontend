import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { emitEvent } from "./engine";
import type { AutomationEvent, AutomationEventType } from "./engine/types";

const EventSchema = z.object({
  type: z.enum([
    "message_received",
    "message_sent",
    "contact_added",
    "template_used",
    "media_saved",
    "scheduled_time",
  ]),
  workspaceId: z.string().uuid(),
  payload: z.record(z.string(), z.unknown()).default({}),
  isTest: z.boolean().optional(),
});

export const emitAutomationEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => EventSchema.parse(data))
  .handler(async ({ data, context }) => {
    const event: AutomationEvent = {
      type: data.type as AutomationEventType,
      workspaceId: data.workspaceId,
      payload: data.payload,
      isTest: data.isTest,
      occurredAt: new Date().toISOString(),
    };
    // Verify caller is a member of the workspace (RLS-scoped client)
    const { data: member } = await context.supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_id", event.workspaceId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!member) throw new Error("Forbidden");

    return await emitEvent(context.supabase, event);
  });

const TestSchema = z.object({
  flowId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  sample: z.object({
    text: z.string().optional(),
    tags: z.array(z.string()).optional(),
    time: z.string().optional(),
    day: z.string().optional(),
    contactId: z.string().uuid().optional().nullable(),
    conversationId: z.string().uuid().optional().nullable(),
  }),
});

export const runFlowTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => TestSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: flow, error } = await context.supabase
      .from("flows")
      .select("*")
      .eq("id", data.flowId)
      .maybeSingle();
    if (error || !flow) throw new Error("Flow not found");

    const event: AutomationEvent = {
      type: flow.trigger as AutomationEventType,
      workspaceId: data.workspaceId,
      payload: {
        text: data.sample.text ?? "",
        tags: data.sample.tags ?? [],
        time: data.sample.time ?? "",
        day: data.sample.day ?? "",
        contactId: data.sample.contactId ?? null,
        conversationId: data.sample.conversationId ?? null,
      },
      isTest: true,
    };
    return await emitEvent(context.supabase, event);
  });

const QueueIdSchema = z.object({ id: z.string().uuid() });

export const cancelQueueItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => QueueIdSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { cancelItem } = await import("./engine/queue");
    await cancelItem(context.supabase, data.id);
    return { ok: true };
  });

export const retryQueueItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => QueueIdSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { retryItem } = await import("./engine/queue");
    await retryItem(context.supabase, data.id);
    return { ok: true };
  });
