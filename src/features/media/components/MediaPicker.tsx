import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Star, LayoutGrid, Rows3, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { mediaListQueryOptions, mediaRecentUsedQueryOptions } from "../queries";
import type { MediaRow, MediaFileType } from "../types";
import { MediaCard } from "./MediaCard";
import { MediaList } from "./MediaList";

interface Props {
  onSelect: (rows: MediaRow[]) => void;
  multiple?: boolean;
  excludeIds?: string[];
  onCancel?: () => void;
}

export function MediaPicker({ onSelect, multiple = false, excludeIds = [], onCancel }: Props) {
  const { data: workspace } = useCurrentWorkspace();
  const [q, setQ] = useState("");
  const [type, setType] = useState<MediaFileType | "all">("all");
  const [favOnly, setFavOnly] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Record<string, MediaRow>>({});

  const listQ = useQuery({
    ...mediaListQueryOptions({
      workspaceId: workspace?.id ?? "",
      q,
      type,
      favoritesOnly: favOnly,
      sort: "newest",
    }),
    enabled: Boolean(workspace?.id),
  });
  const recentQ = useQuery(mediaRecentUsedQueryOptions(workspace?.id));

  const exclude = useMemo(() => new Set(excludeIds), [excludeIds]);
  const rows = useMemo(
    () => (listQ.data ?? []).filter((r) => !exclude.has(r.id)),
    [listQ.data, exclude],
  );
  const recent = useMemo(
    () => (recentQ.data ?? []).filter((r) => !exclude.has(r.id)).slice(0, 6),
    [recentQ.data, exclude],
  );

  function toggle(m: MediaRow) {
    if (!multiple) {
      onSelect([m]);
      return;
    }
    setSelected((prev) => {
      const next = { ...prev };
      if (next[m.id]) delete next[m.id];
      else next[m.id] = m;
      return next;
    });
  }

  const selectedList = useMemo(() => Object.values(selected), [selected]);
  const selectedIds = useMemo(() => new Set(Object.keys(selected)), [selected]);

  return (
    <div className="flex h-[560px] max-h-[70vh] w-full flex-col">
      <div className="flex flex-col gap-2 border-b border-border/60 p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search media…"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Select value={type} onValueChange={(v) => setType(v as MediaFileType | "all")}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="pdf">PDFs</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>
          <Toggle
            pressed={favOnly}
            onPressedChange={setFavOnly}
            aria-label="Favorites"
            className="h-8"
          >
            <Star className={cn("h-3.5 w-3.5", favOnly && "fill-amber-400 text-amber-400")} />
          </Toggle>
          <div className="inline-flex items-center gap-0.5 rounded-md border border-border p-0.5">
            <Button
              size="icon"
              variant={view === "grid" ? "secondary" : "ghost"}
              className="h-7 w-7"
              onClick={() => setView("grid")}
              aria-label="Grid"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant={view === "list" ? "secondary" : "ghost"}
              className="h-7 w-7"
              onClick={() => setView("list")}
              aria-label="List"
            >
              <Rows3 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {listQ.isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading media…</p>
        ) : rows.length === 0 && recent.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No media yet. Upload files from the Media page.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {recent.length && !q && type === "all" && !favOnly ? (
              <section className="flex flex-col gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Recently used
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {recent.map((m) => (
                    <PickerTile
                      key={m.id}
                      media={m}
                      selected={selectedIds.has(m.id)}
                      onClick={() => toggle(m)}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="flex flex-col gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                All media
              </p>
              {view === "grid" ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {rows.map((m) => (
                    <PickerTile
                      key={m.id}
                      media={m}
                      selected={selectedIds.has(m.id)}
                      onClick={() => toggle(m)}
                    />
                  ))}
                </div>
              ) : (
                <MediaList items={rows} selectedIds={selectedIds} onToggleSelect={toggle} />
              )}
            </section>
          </div>
        )}
      </div>

      {multiple ? (
        <div className="flex items-center justify-between border-t border-border/60 p-3">
          <span className="text-xs text-muted-foreground">{selectedList.length} selected</span>
          <div className="flex items-center gap-2">
            {onCancel ? (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
            <Button
              size="sm"
              disabled={!selectedList.length}
              onClick={() => onSelect(selectedList)}
            >
              <Check className="mr-1.5 h-3.5 w-3.5" /> Attach {selectedList.length || ""}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PickerTile({
  media,
  selected,
  onClick,
}: {
  media: MediaRow;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div className="w-full">
      <MediaCard media={media} selected={selected} onClick={onClick} compact />
    </div>
  );
}
