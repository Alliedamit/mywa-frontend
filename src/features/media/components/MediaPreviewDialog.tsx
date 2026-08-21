import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { MediaRow } from "../types";
import { useSignedUrl } from "../hooks";
import { formatBytes } from "../constants";
import { iconFor } from "./MediaThumbnail";
import { downloadMedia } from "../mutations";

interface Props {
  media: MediaRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function MediaPreviewDialog({ media, open, onOpenChange }: Props) {
  const { url } = useSignedUrl(open && media ? media.storage_path : null, 600);

  if (!media) return null;
  const Icon = iconFor(media.file_type, media.mime_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate">{media.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
            {media.file_type === "image" && url ? (
              <img src={url} alt={media.name} className="max-h-[70vh] object-contain" />
            ) : media.file_type === "pdf" && url ? (
              <iframe
                title={media.name}
                src={url}
                className="h-[70vh] w-full"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <Icon className="h-14 w-14 text-muted-foreground" strokeWidth={1.2} />
                <p className="text-sm font-medium">{media.original_filename}</p>
                <p className="text-xs text-muted-foreground">
                  {media.mime_type} · {formatBytes(media.file_size)}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {media.original_filename} · {formatBytes(media.file_size)}
            </span>
            <Button size="sm" variant="secondary" onClick={() => downloadMedia(media)}>
              <Download className="mr-1.5 h-4 w-4" /> Download
            </Button>
          </div>
          {media.description ? (
            <p className="text-sm text-muted-foreground">{media.description}</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
