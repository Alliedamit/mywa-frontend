import { z } from "zod";
import { normalizeShortcut } from "./utils";

export const templateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  category: z.string().trim().min(1, "Category is required").max(40),
  shortcut: z
    .string()
    .optional()
    .transform((v) => normalizeShortcut(v ?? "") ?? undefined)
    .refine(
      (v) => v === undefined || /^[a-z0-9_-]{2,32}$/.test(v),
      "Shortcut must be 2–32 chars: a–z, 0–9, _ or -",
    ),
  content: z.string().trim().min(1, "Message is required").max(4000),
  is_favorite: z.boolean().optional(),
});

export type TemplateFormValues = z.input<typeof templateSchema>;
export type TemplateFormParsed = z.output<typeof templateSchema>;
