import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { NoteWithAuthor } from "./types";

const sel = (s: string): string => s;

export function notesQueryOptions(contactId: string | null) {
  return queryOptions({
    queryKey: ["notes", contactId],
    enabled: Boolean(contactId),
    queryFn: async (): Promise<NoteWithAuthor[]> => {
      if (!contactId) return [];
      const { data, error } = await supabase
        .from("notes")
        .select(
          sel(
            "id, workspace_id, contact_id, note, created_by, created_at, author:profiles!notes_created_by_fkey(id, full_name)",
          ),
        )
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });
      // Fallback: if the FK-alias join fails (no explicit FK named), fetch profiles separately.
      if (error) {
        const { data: rows, error: err2 } = await supabase
          .from("notes")
          .select("id, workspace_id, contact_id, note, created_by, created_at")
          .eq("contact_id", contactId)
          .order("created_at", { ascending: false });
        if (err2) throw err2;
        const ids = Array.from(
          new Set((rows ?? []).map((r) => r.created_by).filter(Boolean)),
        ) as string[];
        let authors: Record<string, { id: string; full_name: string | null }> = {};
        if (ids.length) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", ids);
          authors = Object.fromEntries((profs ?? []).map((p) => [p.id, p]));
        }
        return (rows ?? []).map((r) => ({
          ...r,
          author: r.created_by ? (authors[r.created_by] ?? null) : null,
        }));
      }
      return (data as unknown as NoteWithAuthor[]) ?? [];
    },
  });
}
