import { z } from "zod";

export const flowConditionSchema = z.object({
  id: z.string(),
  field: z.enum(["message_text", "contact_tag", "time_of_day", "day_of_week", "always"]),
  operator: z.enum([
    "contains",
    "starts_with",
    "ends_with",
    "equals",
    "has_tag",
    "at_time",
    "on_day",
    "always",
  ]),
  value: z.string().default(""),
  combinator: z.enum(["and", "or"]).default("and"),
});

export const flowActionSchema = z.object({
  id: z.string(),
  type: z.enum([
    "insert_template",
    "attach_media",
    "add_tag",
    "remove_tag",
    "create_note",
    "mark_favorite",
    "send_notification",
    "delay",
  ]),
  params: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]).optional())
    .default({}),
});

export const flowSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  trigger: z.enum([
    "message_received",
    "message_sent",
    "contact_added",
    "template_used",
    "media_saved",
    "scheduled_time",
  ]),
  conditions: z.array(flowConditionSchema).default([]),
  actions: z.array(flowActionSchema).min(1, "Add at least one action"),
  status: z.enum(["draft", "active", "paused", "archived"]).default("draft"),
});

export type FlowFormValues = z.input<typeof flowSchema>;
export type FlowFormParsed = z.output<typeof flowSchema>;
