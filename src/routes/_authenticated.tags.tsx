import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Tags, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { z } from "zod";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { SearchInput } from "@/components/common/search-input";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { TagChip } from "@/components/common/tag-chip";
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
import { tagsQueryOptions } from "@/features/crm/tags.queries";
import { deleteTag } from "@/features/crm/tags.mutations";
import { TagDrawer } from "@/features/crm/components/tag-drawer";
import type { TagWithCount } from "@/features/crm/types";
import { notify } from "@/lib/notify";

const searchSchema = z.object({ q: z.string().optional().catch("") });
type TagsSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/_authenticated/tags")({
  validateSearch: (s) => searchSchema.parse(s),
  component: TagsPage,
});

function TagsPage() {
  const { data: workspace } = useCurrentWorkspace();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const q = search.q ?? "";

  const [searchInput, setSearchInput] = useState(q);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<TagWithCount | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TagWithCount | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === q) return;
      navigate({
        to: ".",
        search: (prev: TagsSearch) => ({ ...prev, q: searchInput || undefined }),
      });
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const tagsQ = useQuery({
    ...tagsQueryOptions(workspace?.id ?? "", q),
    enabled: Boolean(workspace?.id),
  });

  const rows = tagsQ.data ?? [];
  const isEmpty = !tagsQ.isLoading && rows.length === 0 && !q;

  return (
    <>
      <PageHeader
        title="Tags"
        description="Colored labels to organize contacts."
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New tag
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={Tags}
          title="No tags yet"
          description="Create your first tag to group and filter contacts."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> New tag
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="max-w-md">
            <SearchInput
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search tags…"
            />
          </div>

          {tagsQ.isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState icon={Tags} title="No matches" description="Try a different search term." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((t) => (
                <Card key={t.id} className="group flex items-center gap-3 p-4">
                  <TagChip name={t.name} color={t.color} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.contacts_count} contact{t.contacts_count === 1 ? "" : "s"}
                      {t.description ? ` · ${t.description}` : ""}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(t)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setConfirmDelete(t)}
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

      <TagDrawer open={addOpen} onOpenChange={setAddOpen} />
      <TagDrawer
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        tag={editing}
      />
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete tag?"
        description="This will remove the tag from all contacts. This cannot be undone."
        destructive
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!confirmDelete) return;
          await deleteTag(confirmDelete.id);
          notify.success("Tag deleted.");
          qc.invalidateQueries({ queryKey: ["tags"] });
          qc.invalidateQueries({ queryKey: ["contact-tags"] });
        }}
      />
    </>
  );
}
