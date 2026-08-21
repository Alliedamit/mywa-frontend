import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Tags as TagsIcon, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { z } from "zod";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { SearchInput } from "@/components/common/search-input";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { segmentsQueryOptions } from "@/features/crm/segments.queries";
import { deleteSegment } from "@/features/crm/segments.mutations";
import { SegmentDrawer } from "@/features/crm/components/segment-drawer";
import type { SegmentRow } from "@/features/crm/types";
import { notify } from "@/lib/notify";

const searchSchema = z.object({ q: z.string().optional().catch("") });
type SegmentsSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/_authenticated/segments")({
  validateSearch: (s) => searchSchema.parse(s),
  component: SegmentsPage,
});

function SegmentsPage() {
  const { data: workspace } = useCurrentWorkspace();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const q = search.q ?? "";

  const [searchInput, setSearchInput] = useState(q);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<SegmentRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SegmentRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === q) return;
      navigate({
        to: ".",
        search: (prev: SegmentsSearch) => ({ ...prev, q: searchInput || undefined }),
      });
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const segsQ = useQuery({
    ...segmentsQueryOptions(workspace?.id ?? "", q),
    enabled: Boolean(workspace?.id),
  });

  const rows = segsQ.data ?? [];
  const isEmpty = !segsQ.isLoading && rows.length === 0 && !q;

  return (
    <>
      <PageHeader
        title="Segments"
        description="Dynamic groups of contacts defined by rules."
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New segment
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={TagsIcon}
          title="No segments yet"
          description="Create your first segment to target the right contacts."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> New segment
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="max-w-md">
            <SearchInput
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search segments…"
            />
          </div>
          {segsQ.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={TagsIcon}
              title="No matches"
              description="Try a different search term."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {rows.map((s) => (
                <Card
                  key={s.id}
                  className="flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-muted/40"
                  onClick={() => setEditing(s)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.description ?? "No description"}
                    </p>
                  </div>
                  <div className="hidden text-right text-xs text-muted-foreground sm:block">
                    <p>— contacts</p>
                    <p>
                      Updated {formatDistanceToNow(new Date(s.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => setEditing(s)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setConfirmDelete(s)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <SegmentDrawer open={addOpen} onOpenChange={setAddOpen} />
      <SegmentDrawer
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        segment={editing}
      />
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete segment?"
        description="This cannot be undone."
        destructive
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!confirmDelete) return;
          await deleteSegment(confirmDelete.id);
          notify.success("Segment deleted.");
          qc.invalidateQueries({ queryKey: ["segments"] });
        }}
      />
    </>
  );
}
