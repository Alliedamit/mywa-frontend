import { z } from "zod";

export const mediaMetaSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(180),
  category: z.string().trim().max(60).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  is_favorite: z.boolean().default(false),
});

export type MediaMetaValues = z.infer<typeof mediaMetaSchema>;

export const mediaRenameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(180),
});

export type MediaRenameValues = z.infer<typeof mediaRenameSchema>;
