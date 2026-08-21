import { supabase } from "@/integrations/supabase/client";
import type { MediaFileType, MediaRow } from "./types";
import { MEDIA_BUCKET, detectFileType, folderFor, sanitizeFilename } from "./constants";
import { emitAutomationEvent } from "@/features/automation/automation.functions";

export class UnsupportedFileError extends Error {
  constructor(name: string) {
    super(`Unsupported file type: ${name}`);
    this.name = "UnsupportedFileError";
  }
}

export class FileTooLargeError extends Error {
  constructor(max: number) {
    super(`File exceeds ${Math.round(max / (1024 * 1024))}MB limit`);
    this.name = "FileTooLargeError";
  }
}

export async function findDuplicate(
  workspaceId: string,
  filename: string,
  size: number,
): Promise<MediaRow | null> {
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("workspace_id", workspaceId)
    .ilike("original_filename", filename)
    .eq("file_size", size)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return (data as MediaRow | null) ?? null;
}

export interface UploadArgs {
  workspaceId: string;
  userId: string;
  file: File;
  meta: {
    name: string;
    category?: string | null;
    description?: string | null;
    is_favorite?: boolean;
  };
  replaceOf?: MediaRow | null;
  onProgress?: (pct: number) => void;
}

export async function uploadMedia(args: UploadArgs): Promise<MediaRow> {
  const { workspaceId, userId, file, meta, replaceOf } = args;
  const type = detectFileType(file.type, file.name);
  if (!type) throw new UnsupportedFileError(file.name);

  const folder = folderFor(type);
  const cleanName = sanitizeFilename(file.name);
  const uniquePart = replaceOf
    ? replaceOf.storage_path.split("/").pop()
    : `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${cleanName}`;
  const storagePath = replaceOf ? replaceOf.storage_path : `${workspaceId}/${folder}/${uniquePart}`;

  const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
    cacheControl: "3600",
    upsert: Boolean(replaceOf),
  });
  if (upErr) throw upErr;
  args.onProgress?.(100);

  if (replaceOf) {
    const { data, error } = await supabase
      .from("media")
      .update({
        name: meta.name,
        original_filename: file.name,
        mime_type: file.type || "application/octet-stream",
        file_size: file.size,
        category: meta.category ?? null,
        description: meta.description ?? null,
        is_favorite: meta.is_favorite ?? replaceOf.is_favorite,
      })
      .eq("id", replaceOf.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as MediaRow;
  }

  const { data, error } = await supabase
    .from("media")
    .insert({
      workspace_id: workspaceId,
      uploaded_by: userId,
      name: meta.name,
      original_filename: file.name,
      file_type: type as MediaFileType,
      mime_type: file.type || "application/octet-stream",
      file_size: file.size,
      category: meta.category ?? null,
      description: meta.description ?? null,
      is_favorite: meta.is_favorite ?? false,
      storage_path: storagePath,
    })
    .select("*")
    .single();
  if (error) {
    // Cleanup uploaded object on DB failure.
    await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
    throw error;
  }
  void emitAutomationEvent({
    data: {
      type: "media_saved",
      workspaceId,
      payload: { mediaId: (data as MediaRow).id, text: meta.name },
    },
  }).catch((e) => console.error("[automation] media_saved", e));
  return data as MediaRow;
}

export async function renameMedia(id: string, name: string): Promise<void> {
  const { error } = await supabase.from("media").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function toggleMediaFavorite(id: string, next: boolean): Promise<void> {
  const { error } = await supabase.from("media").update({ is_favorite: next }).eq("id", id);
  if (error) throw error;
}

export async function touchMediaLastUsed(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase
    .from("media")
    .update({ last_used_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
}

export async function deleteMedia(row: MediaRow): Promise<void> {
  const paths = [row.storage_path];
  if (row.thumbnail_path) paths.push(row.thumbnail_path);
  await supabase.storage.from(MEDIA_BUCKET).remove(paths);
  const { error } = await supabase.from("media").delete().eq("id", row.id);
  if (error) throw error;
}

export async function downloadMedia(row: MediaRow): Promise<void> {
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(row.storage_path, 60, { download: row.original_filename });
  if (error || !data) throw error ?? new Error("Failed to prepare download");
  const a = document.createElement("a");
  a.href = data.signedUrl;
  a.download = row.original_filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Copy an inbox attachment (already in the app's storage) into the Media Library. */
export async function saveMessageAttachmentToMedia(args: {
  workspaceId: string;
  userId: string;
  messageId: string;
  attachment: {
    file_name: string;
    file_type: string;
    file_size: number | null;
    storage_path: string | null;
  };
}): Promise<{ media: MediaRow; existed: boolean }> {
  const { workspaceId, userId, messageId, attachment } = args;
  if (!attachment.storage_path) throw new Error("Attachment has no stored file");
  const size = attachment.file_size ?? 0;

  const existing = await findDuplicate(workspaceId, attachment.file_name, size);
  if (existing) {
    await supabase
      .from("message_media")
      .upsert({ message_id: messageId, media_id: existing.id })
      .throwOnError();
    return { media: existing, existed: true };
  }

  const type = detectFileType(attachment.file_type, attachment.file_name);
  if (!type) throw new UnsupportedFileError(attachment.file_name);
  const folder = folderFor(type);
  const cleanName = sanitizeFilename(attachment.file_name);
  const targetPath = `${workspaceId}/${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${cleanName}`;

  // Download original bytes via a short-lived signed URL, then re-upload into the media bucket.
  const src = await supabase.storage
    .from("message-attachments")
    .createSignedUrl(attachment.storage_path, 60);
  let bytes: Blob;
  if (src.data?.signedUrl) {
    const res = await fetch(src.data.signedUrl);
    if (!res.ok) throw new Error("Failed to fetch original attachment");
    bytes = await res.blob();
  } else {
    // Fallback: try the same bucket path in `media` (in case attachments already live there).
    throw src.error ?? new Error("Cannot access original attachment");
  }

  const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(targetPath, bytes, {
    contentType: attachment.file_type || "application/octet-stream",
    cacheControl: "3600",
    upsert: false,
  });
  if (upErr) throw upErr;

  const { data, error } = await supabase
    .from("media")
    .insert({
      workspace_id: workspaceId,
      uploaded_by: userId,
      name: attachment.file_name,
      original_filename: attachment.file_name,
      file_type: type,
      mime_type: attachment.file_type || "application/octet-stream",
      file_size: size,
      storage_path: targetPath,
    })
    .select("*")
    .single();
  if (error) {
    await supabase.storage.from(MEDIA_BUCKET).remove([targetPath]);
    throw error;
  }

  await supabase
    .from("message_media")
    .upsert({ message_id: messageId, media_id: data.id })
    .throwOnError();

  return { media: data as MediaRow, existed: false };
}

// ------------------------------------------------------------------
// Template ↔ media links
// ------------------------------------------------------------------

export async function listTemplateMedia(templateId: string): Promise<MediaRow[]> {
  const { data, error } = await supabase
    .from("template_media")
    .select("position, media:media(*)")
    .eq("template_id", templateId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? [])
    .map((r) => (r as { media: MediaRow | null }).media)
    .filter((m): m is MediaRow => Boolean(m));
}

export async function setTemplateMedia(templateId: string, mediaIds: string[]): Promise<void> {
  const { error: delErr } = await supabase
    .from("template_media")
    .delete()
    .eq("template_id", templateId);
  if (delErr) throw delErr;
  if (!mediaIds.length) return;
  const rows = mediaIds.map((id, i) => ({
    template_id: templateId,
    media_id: id,
    position: i,
  }));
  const { error } = await supabase.from("template_media").insert(rows);
  if (error) throw error;
}
