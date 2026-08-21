import { useMemo } from "react";
import { FileText, FileImage, FileSpreadsheet, Presentation, File as FileIcon } from "lucide-react";
import type { MediaRow, MediaFileType } from "../types";
import { useSignedUrl } from "../hooks";
import { cn } from "@/lib/utils";

export function MediaThumbnail({ media, className }: { media: MediaRow; className?: string }) {
  const isImage = media.file_type === "image";
  const { url } = useSignedUrl(isImage ? media.storage_path : null, 600);

  const IconComp = useMemo(
    () => iconFor(media.file_type, media.mime_type),
    [media.file_type, media.mime_type],
  );

  if (isImage && url) {
    return (
      <img
        src={url}
        alt={media.name}
        loading="lazy"
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-muted text-muted-foreground",
        className,
      )}
    >
      <IconComp className="h-10 w-10" strokeWidth={1.4} />
    </div>
  );
}

export function iconFor(type: MediaFileType, mime?: string) {
  if (type === "image") return FileImage;
  if (type === "pdf") return FileText;
  if (type === "document") {
    if (mime?.includes("sheet") || mime?.includes("excel")) return FileSpreadsheet;
    if (mime?.includes("presentation") || mime?.includes("powerpoint")) return Presentation;
    return FileText;
  }
  return FileIcon;
}
