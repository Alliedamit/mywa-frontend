export interface CompanyRow {
  id: string;
  workspace_id: string;
  company_name: string;
  website: string | null;
  industry: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyWithCount extends CompanyRow {
  contacts_count: number;
}

export interface ContactRow {
  id: string;
  workspace_id: string;
  company_id: string | null;
  first_name: string;
  last_name: string | null;
  display_name: string | null;
  whatsapp_number: string;
  email: string | null;
  designation: string | null;
  owner_user_id: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactTagRef {
  tag: { id: string; name: string; color: string } | null;
}

export interface ContactWithRelations extends ContactRow {
  company: { id: string; company_name: string } | null;
  contact_tags?: ContactTagRef[];
}

export type ContactSort = "newest" | "oldest" | "name_asc" | "name_desc";
export type CompanySort = "name_asc" | "name_desc" | "newest" | "oldest";

export interface TagRow {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}
export interface TagWithCount extends TagRow {
  contacts_count: number;
}

// Segments
export interface SegmentRule {
  field: string;
  operator: string;
  value: unknown;
}
export interface SegmentGroup {
  combinator: "and" | "or";
  rules: (SegmentRule | SegmentGroup)[];
}
export function isSegmentGroup(node: SegmentRule | SegmentGroup): node is SegmentGroup {
  return typeof node === "object" && node !== null && "combinator" in node;
}
export interface SegmentRow {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  rules: SegmentGroup;
  created_at: string;
  updated_at: string;
}

// Notes
export interface NoteRow {
  id: string;
  workspace_id: string;
  contact_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
}
export interface NoteWithAuthor extends NoteRow {
  author: { id: string; full_name: string | null } | null;
}

// Custom fields
export type CustomFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "date"
  | "checkbox"
  | "dropdown"
  | "currency";
export type CustomFieldModule = "contact" | "company";
export interface CustomFieldRow {
  id: string;
  workspace_id: string;
  module: CustomFieldModule;
  name: string;
  type: CustomFieldType;
  options: { choices?: string[]; currency?: string } & Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Saved filters
export type SavedFilterModule = "contacts" | "companies";
export interface SavedFilterRow {
  id: string;
  workspace_id: string;
  module: SavedFilterModule;
  name: string;
  filters: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
