export type MediaFileType = "image" | "pdf" | "document" | "video" | "audio";

export interface MediaRow {
  id: string;
  workspace_id: string;
  name: string;
  original_filename: string;
  file_type: MediaFileType;
  mime_type: string;
  category: string | null;
  description: string | null;
  file_size: number;
  storage_path: string;
  thumbnail_path: string | null;
  content_hash: string | null;
  uploaded_by: string | null;
  is_favorite: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MediaSort = "newest" | "oldest";

export interface MediaFilters {
  workspaceId: string;
  q?: string;
  type?: MediaFileType | "all";
  category?: string;
  favoritesOnly?: boolean;
  sort?: MediaSort;
}
