import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Images, Star, LayoutGrid, Rows3 } from "lucide-react";
import { z } from "zod";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { SearchInput } from "@/components/common/search-input";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
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
import { notify } from "@/lib/notify";

import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { mediaListQueryOptions } from "@/features/media/queries";
import {
  deleteMedia,
  downloadMedia,
  renameMedia,
  toggleMediaFavorite,
} from "@/features/media/mutations";
import type { MediaFileType, MediaRow, MediaSort } from "@/features/media/types";
import { MEDIA_CATEGORIES } from "@/features/media/constants";
import { MediaUploadDrawer } from "@/features/media/components/MediaUploadDrawer";
import { MediaGrid } from "@/features/media/components/MediaGrid";
import { MediaList } from "@/features/media/components/MediaList";

import { MediaPreviewDialog } from "@/features/media/components/MediaPreviewDialog";
import { MediaRenameDialog } from "@/features/media/components/MediaRenameDialog";

const searchSchema = z.object({
  q: z.string().optional().catch(""),
  type: z.enum(["all", "image", "pdf", "document"]).optional().catch("all"),
  cat: z.string().optional().catch(undefined),
  fav: z.enum(["1"]).optional().catch(undefined),
  sort: z.enum(["newest", "oldest"]).optional().catch("newest"),
  view: z.enum(["grid", "list"]).optional().catch("grid"),
});
type MediaSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/_authenticated/media")({
  validateSearch: (s) => searchSchema.parse(s),
  component: MediaPage,
});

function MediaPage() {
  const { data: workspace } = useCurrentWorkspace();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();

  const q = search.q ?? "";
  const type = (search.type ?? "all") as MediaFileType | "all";
  const category = search.cat;
  const favoritesOnly = search.fav === "1";
  const sort = (search.sort ?? "newest") as MediaSort;
  const view = search.view ?? "grid";

  const [searchInput, setSearchInput] = useState(q);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<MediaRow | null>(null);
  const [renaming, setRenaming] = useState<MediaRow | null>(null);
  const [confirmDel, setConfirmDel] = useState<MediaRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === q) return;
      navigate({
        to: ".",
        search: (prev: MediaSearch) => ({ ...prev, q: searchInput || undefined }),
      });
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const listQ = useQuery({
    ...mediaListQueryOptions({
      workspaceId: workspace?.id ?? "",
      q,
      type,
      category,
      favoritesOnly,
      sort,
    }),
    enabled: Boolean(workspace?.id),
  });

  const items = listQ.data ?? [];
  const isTrulyEmpty =
    !listQ.isLoading && !items.length && !q && type === "all" && !category && !favoritesOnly;

  const favMut = useMutation({
    mutationFn: (m: MediaRow) => toggleMediaFavorite(m.id, !m.is_favorite),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["media"] }),
    onError: (e) => notify.error(e instanceof Error ? e.message : "Failed"),
  });

  const delMut = useMutation({
    mutationFn: (m: MediaRow) => deleteMedia(m),
    onSuccess: () => {
      notify.success("Media deleted.");
      qc.invalidateQueries({ queryKey: ["media"] });
    },
    onError: (e) => notify.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  const renameMut = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => renameMedia(id, name),
    onSuccess: () => {
      notify.success("Renamed.");
      qc.invalidateQueries({ queryKey: ["media"] });
    },
    onError: (e) => notify.error(e instanceof Error ? e.message : "Failed to rename"),
  });

  const actionHandlers = useMemo(
    () => ({
      onPreview: (m: MediaRow) => setPreview(m),
      onRename: (m: MediaRow) => setRenaming(m),
      onToggleFavorite: (m: MediaRow) => favMut.mutate(m),
      onDownload: (m: MediaRow) =>
        downloadMedia(m).catch((e) =>
          notify.error(e instanceof Error ? e.message : "Download failed"),
        ),
      onCopyName: (m: MediaRow) => {
        navigator.clipboard.writeText(m.name);
        notify.success("Name copied.");
      },
      onDelete: (m: MediaRow) => setConfirmDel(m),
    }),
    [favMut],
  );

  return (
    <>
      <PageHeader
        title="Media"
        description="Store reusable files for WhatsApp."
        actions={
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Upload media
          </Button>
        }
      />

      {isTrulyEmpty ? (
        <EmptyState
          icon={Images}
          title="No media yet"
          description="Upload images, PDFs, and documents to reuse across templates and messages."
          action={
            <Button onClick={() => setUploadOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Upload media
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="max-w-md flex-1">
              <SearchInput
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name, filename, category…"
              />
            </div>
            <Select
              value={type}
              onValueChange={(v) =>
                navigate({
                  to: ".",
                  search: (p: MediaSearch) => ({
                    ...p,
                    type: v === "all" ? undefined : (v as MediaSearch["type"]),
                  }),
                })
              }
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="pdf">PDFs</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={category ?? "all"}
              onValueChange={(v) =>
                navigate({
                  to: ".",
                  search: (p: MediaSearch) => ({
                    ...p,
                    cat: v === "all" ? undefined : v,
                  }),
                })
              }
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {MEDIA_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sort}
              onValueChange={(v) =>
                navigate({
                  to: ".",
                  search: (p: MediaSearch) => ({
                    ...p,
                    sort: (v as MediaSort) === "newest" ? undefined : (v as MediaSort),
                  }),
                })
              }
            >
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
            <Toggle
              pressed={favoritesOnly}
              onPressedChange={(v) =>
                navigate({
                  to: ".",
                  search: (p: MediaSearch) => ({ ...p, fav: v ? "1" : undefined }),
                })
              }
              aria-label="Favorites"
              className="gap-1.5"
            >
              <Star className={cn("h-4 w-4", favoritesOnly && "fill-amber-400 text-amber-400")} />
              Favorites
            </Toggle>
            <div className="ml-auto inline-flex items-center gap-0.5 rounded-md border border-border p-0.5">
              <Button
                size="icon"
                variant={view === "grid" ? "secondary" : "ghost"}
                className="h-7 w-7"
                onClick={() =>
                  navigate({
                    to: ".",
                    search: (p: MediaSearch) => ({ ...p, view: undefined }),
                  })
                }
                aria-label="Grid"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant={view === "list" ? "secondary" : "ghost"}
                className="h-7 w-7"
                onClick={() =>
                  navigate({
                    to: ".",
                    search: (p: MediaSearch) => ({ ...p, view: "list" }),
                  })
                }
                aria-label="List"
              >
                <Rows3 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {listQ.isLoading ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Loading media…</p>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Images}
              title="No matches"
              description="Try a different search or clear the filters."
            />
          ) : view === "grid" ? (
            <MediaGrid
              items={items}
              onOpen={(m) => setPreview(m)}
              onFavorite={(m) => favMut.mutate(m)}
              actions={actionHandlers}
            />
          ) : (
            <MediaList
              items={items}
              onOpen={(m) => setPreview(m)}
              onFavorite={(m) => favMut.mutate(m)}
              actions={actionHandlers}
            />
          )}
        </div>
      )}

      <MediaUploadDrawer open={uploadOpen} onOpenChange={setUploadOpen} />
      <MediaPreviewDialog
        media={preview}
        open={Boolean(preview)}
        onOpenChange={(o) => !o && setPreview(null)}
      />
      <MediaRenameDialog
        media={renaming}
        open={Boolean(renaming)}
        onOpenChange={(o) => !o && setRenaming(null)}
        onSubmit={async (name) => {
          if (renaming) await renameMut.mutateAsync({ id: renaming.id, name });
        }}
      />
      <ConfirmDialog
        open={Boolean(confirmDel)}
        onOpenChange={(o) => !o && setConfirmDel(null)}
        title="Delete media?"
        description="The file will be permanently removed from storage."
        destructive
        confirmLabel="Delete"
        onConfirm={async () => {
          if (confirmDel) await delMut.mutateAsync(confirmDel);
        }}
      />
    </>
  );
}
