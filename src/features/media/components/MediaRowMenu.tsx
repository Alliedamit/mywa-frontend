import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaActionsMenu } from "./MediaActionsMenu";
import type { MediaRow } from "../types";

export interface MediaActionHandlers {
  onPreview: (m: MediaRow) => void;
  onRename: (m: MediaRow) => void;
  onToggleFavorite: (m: MediaRow) => void;
  onDownload: (m: MediaRow) => void;
  onCopyName: (m: MediaRow) => void;
  onDelete: (m: MediaRow) => void;
}

export function MediaRowMenu({
  media,
  handlers,
  className,
}: {
  media: MediaRow;
  handlers: MediaActionHandlers;
  className?: string;
}) {
  return (
    <MediaActionsMenu
      media={media}
      {...handlers}
      trigger={
        <Button
          size="icon"
          variant="ghost"
          className={className ?? "h-7 w-7"}
          onClick={(e) => e.stopPropagation()}
          aria-label="More"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      }
    />
  );
}
