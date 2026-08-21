import type { MediaFileType } from "./types";

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
export const MEDIA_BUCKET = "media";

export const MEDIA_CATEGORIES = [
  "General",
  "Marketing",
  "Support",
  "Sales",
  "Onboarding",
  "Custom",
] as const;

export const IMAGE_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const PDF_MIME = ["application/pdf"];
export const DOCUMENT_MIME = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
];

export const ACCEPTED_MIME = [...IMAGE_MIME, ...PDF_MIME, ...DOCUMENT_MIME];

export const ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt";

export function detectFileType(mime: string, filename: string): MediaFileType | null {
  const lower = mime.toLowerCase();
  const ext = (filename.split(".").pop() ?? "").toLowerCase();
  if (IMAGE_MIME.includes(lower) || ["jpg", "jpeg", "png", "webp"].includes(ext)) return "image";
  if (PDF_MIME.includes(lower) || ext === "pdf") return "pdf";
  if (
    DOCUMENT_MIME.includes(lower) ||
    ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(ext)
  )
    return "document";
  return null;
}

export function folderFor(type: MediaFileType): string {
  switch (type) {
    case "image":
      return "images";
    case "pdf":
      return "pdfs";
    case "document":
      return "documents";
    case "video":
      return "videos";
    case "audio":
      return "audio";
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, "_").slice(0, 180);
}
