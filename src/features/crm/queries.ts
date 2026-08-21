import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  CompanyRow,
  CompanySort,
  CompanyWithCount,
  ContactSort,
  ContactWithRelations,
} from "./types";

export interface ContactsListParams {
  workspaceId: string;
  q?: string;
  sort?: ContactSort;
  page?: number;
  pageSize?: number;
  companyId?: string;
  tagIds?: string[];
  includeArchived?: boolean;
}

export interface PagedResult<T> {
  rows: T[];
  total: number;
}

const contactSelect =
  "id, workspace_id, company_id, first_name, last_name, display_name, whatsapp_number, email, designation, owner_user_id, archived_at, created_at, updated_at, company:companies(id, company_name), contact_tags(tag:tags(id, name, color))";

// Avoid deep parsing of the select literal (see query-builder perf rule)
const sel = (s: string): string => s;

export function contactsQueryOptions(params: ContactsListParams) {
  const {
    workspaceId,
    q = "",
    sort = "newest",
    page = 1,
    pageSize = 25,
    companyId,
    tagIds,
    includeArchived = false,
  } = params;

  return queryOptions({
    queryKey: [
      "contacts",
      workspaceId,
      { q, sort, page, pageSize, companyId, tagIds: tagIds ?? [], includeArchived },
    ],
    queryFn: async (): Promise<PagedResult<ContactWithRelations>> => {
      // Optional tag prefilter: get matching contact IDs first.
      let tagFilteredIds: string[] | null = null;
      if (tagIds && tagIds.length > 0) {
        const { data: tagRows, error: tagErr } = await supabase
          .from("contact_tags")
          .select("contact_id")
          .in("tag_id", tagIds);
        if (tagErr) throw tagErr;
        tagFilteredIds = Array.from(new Set((tagRows ?? []).map((r) => r.contact_id)));
        if (tagFilteredIds.length === 0) return { rows: [], total: 0 };
      }

      let query = supabase
        .from("contacts")
        .select(sel(contactSelect), { count: "exact" })
        .eq("workspace_id", workspaceId);

      if (!includeArchived) query = query.is("archived_at", null);

      if (q.trim()) {
        const like = `%${q.trim()}%`;
        query = query.or(
          `first_name.ilike.${like},last_name.ilike.${like},display_name.ilike.${like},whatsapp_number.ilike.${like},email.ilike.${like}`,
        );
      }
      if (companyId) query = query.eq("company_id", companyId);
      if (tagFilteredIds) query = query.in("id", tagFilteredIds);

      switch (sort) {
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "name_asc":
          query = query.order("first_name", { ascending: true });
          break;
        case "name_desc":
          query = query.order("first_name", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await query.range(from, to).returns<ContactWithRelations[]>();
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },
  });
}

export function contactByIdQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["contact", id],
    queryFn: async (): Promise<ContactWithRelations | null> => {
      const { data, error } = await supabase
        .from("contacts")
        .select(sel(contactSelect))
        .eq("id", id)
        .maybeSingle()
        .returns<ContactWithRelations | null>();
      if (error) throw error;
      return data;
    },
  });
}

export interface CompaniesListParams {
  workspaceId: string;
  q?: string;
  sort?: CompanySort;
  page?: number;
  pageSize?: number;
}

export function companiesQueryOptions(params: CompaniesListParams) {
  const { workspaceId, q = "", sort = "name_asc", page = 1, pageSize = 25 } = params;
  return queryOptions({
    queryKey: ["companies", workspaceId, { q, sort, page, pageSize }],
    queryFn: async (): Promise<PagedResult<CompanyWithCount>> => {
      let query = supabase
        .from("companies")
        .select(
          sel(
            "id, workspace_id, company_name, website, industry, phone, email, created_at, updated_at, contacts(count)",
          ),
          { count: "exact" },
        )
        .eq("workspace_id", workspaceId);

      switch (sort) {
        case "name_desc":
          query = query.order("company_name", { ascending: false });
          break;
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        default:
          query = query.order("company_name", { ascending: true });
      }

      if (q.trim()) {
        const like = `%${q.trim()}%`;
        query = query.or(`company_name.ilike.${like},industry.ilike.${like},email.ilike.${like}`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      type RawRow = CompanyRow & { contacts: { count: number }[] };
      const { data, error, count } = await query.range(from, to).returns<RawRow[]>();
      if (error) throw error;
      const rows: CompanyWithCount[] = (data ?? []).map((row) => ({
        ...row,
        contacts_count: row.contacts?.[0]?.count ?? 0,
      }));
      return { rows, total: count ?? 0 };
    },
  });
}

export function companyOptionsQuery(workspaceId: string, q: string) {
  return queryOptions({
    queryKey: ["company-options", workspaceId, q],
    queryFn: async (): Promise<Pick<CompanyRow, "id" | "company_name">[]> => {
      let query = supabase
        .from("companies")
        .select("id, company_name")
        .eq("workspace_id", workspaceId)
        .order("company_name", { ascending: true })
        .limit(20);
      if (q.trim()) query = query.ilike("company_name", `%${q.trim()}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}
