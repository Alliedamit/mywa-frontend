import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MediaFilters, MediaRow } from "./types";
import { MEDIA_BUCKET } from "./constants";

export function mediaListQueryOptions(params: MediaFilters) {
  const {
    workspaceId,
    q = "",
    type = "all",
    category,
    favoritesOnly = false,
    sort = "newest",
  } = params;
  return queryOptions({
    queryKey: ["media", workspaceId, { q, type, category: category ?? null, favoritesOnly, sort }],
    enabled: Boolean(workspaceId),
    queryFn: async (): Promise<MediaRow[]> => {
      let query = supabase.from("media").select("*").eq("workspace_id", workspaceId);
      if (type && type !== "all") query = query.eq("file_type", type);
      if (favoritesOnly) query = query.eq("is_favorite", true);
      if (category && category !== "all") query = query.eq("category", category);
      if (q.trim()) {
        const like = `%${q.trim()}%`;
        query = query.or(
          `name.ilike.${like},original_filename.ilike.${like},category.ilike.${like}`,
        );
      }
      query = query.order("created_at", { ascending: sort === "oldest" });
      const { data, error } = await query.limit(500);
      if (error) throw error;
      return (data ?? []) as MediaRow[];
    },
  });
}

export function mediaRecentUsedQueryOptions(workspaceId: string | undefined) {
  return queryOptions({
    queryKey: ["media-recent-used", workspaceId ?? ""],
    enabled: Boolean(workspaceId),
    queryFn: async (): Promise<MediaRow[]> => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .eq("workspace_id", workspaceId)
        .not("last_used_at", "is", null)
        .order("last_used_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as MediaRow[];
    },
  });
}

export function mediaByIdsQueryOptions(ids: string[]) {
  const key = [...ids].sort();
  return queryOptions({
    queryKey: ["media-by-ids", key],
    enabled: ids.length > 0,
    queryFn: async (): Promise<MediaRow[]> => {
      if (!ids.length) return [];
      const { data, error } = await supabase.from("media").select("*").in("id", ids);
      if (error) throw error;
      return (data ?? []) as MediaRow[];
    },
  });
}

export async function createSignedUrl(path: string, expiresIn = 300): Promise<string> {
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error || !data) throw error ?? new Error("Failed to sign URL");
  return data.signedUrl;
}
