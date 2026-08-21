import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TemplateFilters, TemplateRow } from "./types";
import { PRESET_CATEGORIES } from "./constants";

export function templatesQueryOptions(params: TemplateFilters) {
  const { workspaceId, q = "", category, favoritesOnly = false } = params;
  return queryOptions({
    queryKey: ["templates", workspaceId, { q, category: category ?? null, favoritesOnly }],
    enabled: Boolean(workspaceId),
    queryFn: async (): Promise<TemplateRow[]> => {
      let query = supabase
        .from("templates")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("is_favorite", { ascending: false })
        .order("updated_at", { ascending: false });

      if (favoritesOnly) query = query.eq("is_favorite", true);
      if (category && category !== "all") query = query.eq("category", category);
      if (q.trim()) {
        const like = `%${q.trim()}%`;
        query = query.or(`name.ilike.${like},shortcut.ilike.${like},content.ilike.${like}`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as TemplateRow[];
    },
  });
}

export function templateCategoriesQueryOptions(workspaceId: string | undefined) {
  return queryOptions({
    queryKey: ["template-categories", workspaceId ?? ""],
    enabled: Boolean(workspaceId),
    queryFn: async (): Promise<string[]> => {
      if (!workspaceId) return [...PRESET_CATEGORIES];
      const { data, error } = await supabase
        .from("templates")
        .select("category")
        .eq("workspace_id", workspaceId);
      if (error) throw error;
      const set = new Set<string>(PRESET_CATEGORIES);
      for (const r of data ?? []) if (r.category) set.add(r.category);
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    },
  });
}
