import { formatDistanceToNow } from "date-fns";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { MediaRow } from "../types";
import { formatBytes } from "../constants";
import { iconFor } from "./MediaThumbnail";
import { MediaRowMenu, type MediaActionHandlers } from "./MediaRowMenu";

interface Props {
  items: MediaRow[];
  onOpen?: (m: MediaRow) => void;
  onFavorite?: (m: MediaRow) => void;
  actions?: MediaActionHandlers;
  selectedIds?: Set<string>;
  onToggleSelect?: (m: MediaRow) => void;
}

export function MediaList({
  items,
  onOpen,
  onFavorite,
  actions,
  selectedIds,
  onToggleSelect,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            {onToggleSelect ? <TableHead className="w-10" /> : null}
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Type</TableHead>
            <TableHead className="hidden md:table-cell">Category</TableHead>
            <TableHead className="hidden sm:table-cell">Size</TableHead>
            <TableHead className="hidden lg:table-cell">Uploaded</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((m) => {
            const Icon = iconFor(m.file_type, m.mime_type);
            const selected = selectedIds?.has(m.id);
            return (
              <TableRow
                key={m.id}
                className={cn("cursor-pointer", selected && "bg-primary/5")}
                onClick={() => (onToggleSelect ? onToggleSelect(m) : onOpen?.(m))}
              >
                {onToggleSelect ? (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => onToggleSelect(m)}
                      aria-label="Select"
                    />
                  </TableCell>
                ) : null}
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{m.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {m.original_filename}
                      </p>
                    </div>
                    {m.is_favorite ? (
                      <Star className="ml-1 h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="hidden capitalize md:table-cell">
                  <span className="text-xs text-muted-foreground">{m.file_type}</span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {m.category ? (
                    <Badge variant="secondary">{m.category}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground/60">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                  {formatBytes(m.file_size)}
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                  {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    {onFavorite ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => onFavorite(m)}
                        aria-label={m.is_favorite ? "Unstar" : "Star"}
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            m.is_favorite
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground",
                          )}
                        />
                      </Button>
                    ) : null}
                    {actions ? <MediaRowMenu media={m} handlers={actions} /> : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
