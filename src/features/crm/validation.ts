import { z } from "zod";

const optionalTrimmed = z
  .string()
  .trim()
  .max(255)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined));

const optionalEmail = z
  .string()
  .trim()
  .max(255)
  .email("Enter a valid email")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined));

const optionalUrl = z
  .string()
  .trim()
  .max(255)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined));

const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const whatsappSchema = z
  .string()
  .trim()
  .min(7, "WhatsApp number is required")
  .max(20)
  .regex(phoneRegex, "Enter a valid phone number");

export const contactSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(80),
  whatsapp_number: whatsappSchema,
  last_name: optionalTrimmed,
  display_name: optionalTrimmed,
  email: optionalEmail,
  company_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  designation: optionalTrimmed,
  owner_user_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});
export type ContactFormValues = z.input<typeof contactSchema>;
export type ContactFormParsed = z.output<typeof contactSchema>;

export const companySchema = z.object({
  company_name: z.string().trim().min(1, "Company name is required").max(120),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(phoneRegex, "Enter a valid phone number")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  email: optionalEmail,
  website: optionalUrl,
  industry: optionalTrimmed,
});
export type CompanyFormValues = z.input<typeof companySchema>;
export type CompanyFormParsed = z.output<typeof companySchema>;

export function normalizeWhatsapp(input: string): string {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^0-9]/g, "");
  return hasPlus ? `+${digits}` : digits;
}

// Tags
export const tagSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  color: z.string().trim().regex(hexColorRegex, "Enter a valid hex color"),
  description: optionalTrimmed,
});
export type TagFormValues = z.input<typeof tagSchema>;
export type TagFormParsed = z.output<typeof tagSchema>;

// Segments
export const segmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: optionalTrimmed,
});
export type SegmentFormValues = z.input<typeof segmentSchema>;
export type SegmentFormParsed = z.output<typeof segmentSchema>;

// Notes
export const noteSchema = z.object({
  note: z.string().trim().min(1, "Note cannot be empty").max(4000),
});
export type NoteFormValues = z.input<typeof noteSchema>;

// Custom fields
export const customFieldSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  module: z.enum(["contact", "company"]),
  type: z.enum([
    "text",
    "textarea",
    "number",
    "email",
    "phone",
    "date",
    "checkbox",
    "dropdown",
    "currency",
  ]),
  choices: z.string().optional().default(""),
  currency: z.string().trim().max(10).optional().default(""),
});
export type CustomFieldFormValues = z.input<typeof customFieldSchema>;
export type CustomFieldFormParsed = z.output<typeof customFieldSchema>;

export function parseChoices(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Saved filters
export const savedFilterSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
});
export type SavedFilterFormValues = z.input<typeof savedFilterSchema>;
