import type { ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MediaRow } from "../types";
import { formatBytes } from "../constants";
import { MediaThumbnail } from "./MediaThumbnail";

interface Props {
  media: MediaRow;
  selected?: boolean;
  onClick?: () => void;
  menu?: ReactNode;
  onFavorite?: () => void;
  compact?: boolean;
}

export function MediaCard({ media, selected, onClick, menu, onFavorite, compact }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card text-left transition-all hover:border-border hover:shadow-md",
        selected && "ring-2 ring-primary",
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-muted",
          compact ? "aspect-[4/3]" : "aspect-square",
        )}
      >
        <MediaThumbnail media={media} />
        {onFavorite ? (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1.5 top-1.5 h-7 w-7 bg-background/70 backdrop-blur hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              onFavorite();
            }}
            aria-label={media.is_favorite ? "Unstar" : "Star"}
          >
            <Star
              className={cn(
                "h-3.5 w-3.5",
                media.is_favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
              )}
            />
          </Button>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-2.5">
        <div className="flex items-start justify-between gap-1">
          <p className="line-clamp-1 flex-1 text-sm font-medium leading-tight">{media.name}</p>
          {menu ? <span onClick={(e) => e.stopPropagation()}>{menu}</span> : null}
        </div>
        <div className="flex items-center gap-1.5">
          {media.category ? (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {media.category}
            </Badge>
          ) : null}
          <span className="text-[10px] text-muted-foreground">{formatBytes(media.file_size)}</span>
          <span className="ml-auto text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(media.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </button>
  );
}
