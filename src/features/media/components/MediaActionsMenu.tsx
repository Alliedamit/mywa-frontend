import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Pencil, Star, Download, Copy, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { MediaRow } from "../types";

interface Props {
  trigger: ReactNode;
  media: MediaRow;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  onPreview: (m: MediaRow) => void;
  onRename: (m: MediaRow) => void;
  onToggleFavorite: (m: MediaRow) => void;
  onDownload: (m: MediaRow) => void;
  onCopyName: (m: MediaRow) => void;
  onDelete: (m: MediaRow) => void;
}

export function MediaActionsMenu({
  trigger,
  media,
  open,
  onOpenChange,
  onPreview,
  onRename,
  onToggleFavorite,
  onDownload,
  onCopyName,
  onDelete,
}: Props) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => onPreview(media)}>
          <Eye className="mr-2 h-4 w-4" /> Preview
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onRename(media)}>
          <Pencil className="mr-2 h-4 w-4" /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleFavorite(media)}>
          <Star className="mr-2 h-4 w-4" />
          {media.is_favorite ? "Remove favorite" : "Add to favorites"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownload(media)}>
          <Download className="mr-2 h-4 w-4" /> Download
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCopyName(media)}>
          <Copy className="mr-2 h-4 w-4" /> Copy name
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(media)}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
