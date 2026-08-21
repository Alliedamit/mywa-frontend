export interface TemplateRow {
  id: string;
  workspace_id: string;
  created_by: string | null;
  name: string;
  category: string;
  shortcut: string | null;
  content: string;
  variables: unknown;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateFilters {
  workspaceId: string;
  q?: string;
  category?: string;
  favoritesOnly?: boolean;
}
