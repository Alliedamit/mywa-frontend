import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TagRow, TagWithCount } from "./types";

const sel = (s: string): string => s;

export function tagsQueryOptions(workspaceId: string, q = "") {
  return queryOptions({
    queryKey: ["tags", workspaceId, { q }],
    queryFn: async (): Promise<TagWithCount[]> => {
      let query = supabase
        .from("tags")
        .select(
          sel(
            "id, workspace_id, name, color, description, created_at, updated_at, contact_tags(count)",
          ),
        )
        .eq("workspace_id", workspaceId)
        .order("name", { ascending: true });
      if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
      type Raw = TagRow & { contact_tags: { count: number }[] };
      const { data, error } = await query.returns<Raw[]>();
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        workspace_id: r.workspace_id,
        name: r.name,
        color: r.color,
        description: r.description,
        created_at: r.created_at,
        updated_at: r.updated_at,
        contacts_count: r.contact_tags?.[0]?.count ?? 0,
      }));
    },
  });
}

export function contactTagsQueryOptions(contactId: string) {
  return queryOptions({
    queryKey: ["contact-tags", contactId],
    queryFn: async (): Promise<{ id: string; name: string; color: string }[]> => {
      const { data, error } = await supabase
        .from("contact_tags")
        .select(sel("tag:tags(id, name, color)"))
        .eq("contact_id", contactId);
      if (error) throw error;
      type Raw = { tag: { id: string; name: string; color: string } | null };
      return ((data as unknown as Raw[]) ?? [])
        .map((r) => r.tag)
        .filter((t): t is { id: string; name: string; color: string } => Boolean(t));
    },
  });
}
