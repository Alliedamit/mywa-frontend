import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, MoreHorizontal, Pencil, Trash2, Copy, Star } from "lucide-react";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { SearchInput } from "@/components/common/search-input";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";

import { useCurrentWorkspace } from "@/hooks/use-workspace";
import {
  templateCategoriesQueryOptions,
  templatesQueryOptions,
} from "@/features/templates/queries";
import {
  deleteTemplate,
  duplicateTemplate,
  toggleTemplateFavorite,
} from "@/features/templates/mutations";
import { TemplateDrawer } from "@/features/templates/components/TemplateDrawer";
import type { TemplateRow } from "@/features/templates/types";

const searchSchema = z.object({
  q: z.string().optional().catch(""),
  category: z.string().optional().catch(undefined),
  fav: z.enum(["1"]).optional().catch(undefined),
});
type TemplatesSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/_authenticated/templates")({
  validateSearch: (s) => searchSchema.parse(s),
  component: TemplatesPage,
});

function TemplatesPage() {
  const { data: workspace } = useCurrentWorkspace();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const q = search.q ?? "";
  const category = search.category;
  const favoritesOnly = search.fav === "1";

  const [searchInput, setSearchInput] = useState(q);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TemplateRow | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === q) return;
      navigate({
        to: ".",
        search: (prev: TemplatesSearch) => ({ ...prev, q: searchInput || undefined }),
      });
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const templatesQ = useQuery({
    ...templatesQueryOptions({
      workspaceId: workspace?.id ?? "",
      q,
      category,
      favoritesOnly,
    }),
    enabled: Boolean(workspace?.id),
  });
  const categoriesQ = useQuery(templateCategoriesQueryOptions(workspace?.id));

  const rows = templatesQ.data ?? [];
  const total = rows.length;
  const paged = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page, pageSize],
  );
  const isTrulyEmpty = !templatesQ.isLoading && total === 0 && !q && !category && !favoritesOnly;

  const favMut = useMutation({
    mutationFn: (t: TemplateRow) => toggleTemplateFavorite(t.id, !t.is_favorite),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
    onError: (e) => notify.error(e instanceof Error ? e.message : "Failed"),
  });

  const dupMut = useMutation({
    mutationFn: (t: TemplateRow) =>
      duplicateTemplate({
        workspace_id: t.workspace_id,
        name: t.name,
        category: t.category,
        content: t.content,
        is_favorite: false,
        created_by: t.created_by,
      }),
    onSuccess: () => {
      notify.success("Template duplicated.");
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (e) => notify.error(e instanceof Error ? e.message : "Failed"),
  });

  const columns: DataTableColumn<TemplateRow>[] = [
    {
      key: "fav",
      header: "",
      headerClassName: "w-10",
      className: "w-10",
      cell: (t) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            favMut.mutate(t);
          }}
          aria-label={t.is_favorite ? "Unstar" : "Star"}
        >
          <Star
            className={cn(
              "h-4 w-4",
              t.is_favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
            )}
          />
        </Button>
      ),
    },
    {
      key: "name",
      header: "Name",
      cell: (t) => <span className="font-medium">{t.name}</span>,
    },
    {
      key: "category",
      header: "Category",
      cell: (t) => <Badge variant="secondary">{t.category}</Badge>,
    },
    {
      key: "shortcut",
      header: "Shortcut",
      hideOnTablet: true,
      cell: (t) =>
        t.shortcut ? (
          <span className="font-mono text-xs text-muted-foreground">/{t.shortcut}</span>
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        ),
    },
    {
      key: "preview",
      header: "Preview",
      hideOnTablet: true,
      cell: (t) => (
        <span className="line-clamp-1 max-w-[420px] text-xs text-muted-foreground">
          {t.content}
        </span>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      hideOnTablet: true,
      cell: (t) => (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-10",
      className: "w-10",
      cell: (t) => (
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
            <DropdownMenuItem onClick={() => setEditing(t)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => dupMut.mutate(t)}>
              <Copy className="mr-2 h-4 w-4" /> Duplicate
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
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Templates"
        description="Create reusable replies."
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New template
          </Button>
        }
      />

      {isTrulyEmpty ? (
        <EmptyState
          icon={FileText}
          title="No templates yet"
          description="Create reusable replies with variables and shortcuts."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> New template
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
                placeholder="Search name, shortcut, or content…"
              />
            </div>
            <Select
              value={category ?? "all"}
              onValueChange={(v) =>
                navigate({
                  to: ".",
                  search: (p: TemplatesSearch) => ({
                    ...p,
                    category: v === "all" ? undefined : v,
                  }),
                })
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {(categoriesQ.data ?? []).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Toggle
              pressed={favoritesOnly}
              onPressedChange={(v) =>
                navigate({
                  to: ".",
                  search: (p: TemplatesSearch) => ({ ...p, fav: v ? "1" : undefined }),
                })
              }
              aria-label="Favorites only"
              className="gap-1.5"
            >
              <Star className={cn("h-4 w-4", favoritesOnly && "fill-amber-400 text-amber-400")} />
              Favorites
            </Toggle>
          </div>

          <div className="rounded-xl border border-border/60 bg-card">
            <DataTable
              columns={columns}
              rows={paged}
              rowKey={(t) => t.id}
              loading={templatesQ.isLoading}
              emptyState={
                <EmptyState
                  icon={FileText}
                  title="No matches"
                  description="Try a different search or clear filters."
                />
              }
              onRowClick={(t) => setEditing(t)}
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={(n) => {
                setPageSize(n);
                setPage(1);
              }}
              stickyHeader
            />
          </div>
        </div>
      )}

      <TemplateDrawer open={addOpen} onOpenChange={setAddOpen} />
      <TemplateDrawer
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        template={editing}
      />
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete template?"
        description="This template will be permanently removed."
        destructive
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!confirmDelete) return;
          await deleteTemplate(confirmDelete.id);
          notify.success("Template deleted.");
          qc.invalidateQueries({ queryKey: ["templates"] });
        }}
      />
    </>
  );
}
