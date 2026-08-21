import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Upload,
  Download,
  Users,
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Archive,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { z } from "zod";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { SearchInput } from "@/components/common/search-input";
import { ViewToggle, type ViewMode } from "@/components/common/view-toggle";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { BulkActionBar } from "@/components/common/bulk-action-bar";
import {
  ColumnVisibilityMenu,
  type ColumnOption,
} from "@/components/common/column-visibility-menu";
import { SavedFiltersMenu } from "@/components/common/saved-filters-menu";
import { TagChip } from "@/components/common/tag-chip";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { contactsQueryOptions } from "@/features/crm/queries";
import type { ContactSort, ContactWithRelations } from "@/features/crm/types";
import { ContactDrawer } from "@/features/crm/components/contact-drawer";
import { ContactDetailsDrawer } from "@/features/crm/components/contact-details-drawer";
import { AssignTagsPopover } from "@/features/crm/components/assign-tags-popover";
import { deleteContact, bulkArchiveContacts, bulkDeleteContacts } from "@/features/crm/mutations";
import { notify } from "@/lib/notify";

const searchSchema = z.object({
  q: z.string().optional().catch(""),
  sort: z.enum(["newest", "oldest", "name_asc", "name_desc"]).optional().catch("newest"),
  page: z.number().int().min(1).optional().catch(1),
  pageSize: z.number().int().min(5).max(200).optional().catch(25),
  view: z.enum(["table", "cards"]).optional().catch("table"),
  tagIds: z.array(z.string()).optional().catch([]),
  includeArchived: z.boolean().optional().catch(false),
  savedFilterId: z.string().optional().catch(""),
});

type ContactsSearch = z.infer<typeof searchSchema>;

const COLUMN_OPTIONS: ColumnOption[] = [
  { key: "avatar", label: "Avatar", required: true },
  { key: "name", label: "Name", required: true },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "company", label: "Company" },
  { key: "tags", label: "Tags" },
  { key: "email", label: "Email" },
  { key: "owner", label: "Owner" },
  { key: "created", label: "Created" },
];

const COLUMN_PREF_KEY = "mywa:contacts:columns";

export const Route = createFileRoute("/_authenticated/contacts")({
  validateSearch: (search) => searchSchema.parse(search),
  component: ContactsPage,
});

function ContactsPage() {
  const { data: workspace } = useCurrentWorkspace();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const q = search.q ?? "";
  const sort: ContactSort = search.sort ?? "newest";
  const page = search.page ?? 1;
  const pageSize = search.pageSize ?? 25;
  const view: ViewMode = search.view ?? "table";
  const tagIds = search.tagIds ?? [];
  const includeArchived = search.includeArchived ?? false;
  const savedFilterId = search.savedFilterId ?? "";

  const [addOpen, setAddOpen] = useState(false);
  const [detailsFor, setDetailsFor] = useState<ContactWithRelations | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ContactWithRelations | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [searchInput, setSearchInput] = useState(q);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(COLUMN_PREF_KEY);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(COLUMN_PREF_KEY, JSON.stringify(visibleCols));
    } catch {
      /* ignore */
    }
  }, [visibleCols]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === q) return;
      navigate({
        to: ".",
        search: (prev: ContactsSearch) => ({ ...prev, q: searchInput || undefined, page: 1 }),
      });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const query = useQuery({
    ...contactsQueryOptions({
      workspaceId: workspace?.id ?? "",
      q,
      sort,
      page,
      pageSize,
      tagIds: tagIds.length > 0 ? tagIds : undefined,
      includeArchived,
    }),
    enabled: Boolean(workspace?.id),
  });

  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;
  const isEmpty = !query.isLoading && rows.length === 0 && !q && tagIds.length === 0;

  const columns = useMemo<DataTableColumn<ContactWithRelations>[]>(
    () => [
      {
        key: "avatar",
        header: "",
        headerClassName: "w-10",
        cell: (row) => (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initialsFor(row)}</AvatarFallback>
          </Avatar>
        ),
      },
      {
        key: "name",
        header: "Name",
        sortKey: "first_name",
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {row.first_name} {row.last_name ?? ""}
            </p>
            {row.display_name ? (
              <p className="truncate text-xs text-muted-foreground">{row.display_name}</p>
            ) : null}
          </div>
        ),
      },
      {
        key: "whatsapp",
        header: "WhatsApp",
        cell: (r) => <span className="text-sm">{r.whatsapp_number}</span>,
        hidden: visibleCols.whatsapp === false,
      },
      {
        key: "company",
        header: "Company",
        cell: (r) => <span className="text-sm">{r.company?.company_name ?? "—"}</span>,
        hidden: visibleCols.company === false,
      },
      {
        key: "tags",
        header: "Tags",
        cell: (r) => (
          <div className="flex flex-wrap gap-1">
            {(r.contact_tags ?? [])
              .map((ct) => ct.tag)
              .filter((t): t is { id: string; name: string; color: string } => Boolean(t))
              .slice(0, 3)
              .map((t) => (
                <TagChip key={t.id} name={t.name} color={t.color} size="sm" />
              ))}
          </div>
        ),
        hidden: visibleCols.tags === false,
      },
      {
        key: "email",
        header: "Email",
        cell: (r) => <span className="text-sm text-muted-foreground">{r.email ?? "—"}</span>,
        hideOnTablet: true,
        hidden: visibleCols.email === false,
      },
      {
        key: "owner",
        header: "Owner",
        cell: (r) => (
          <span className="text-sm text-muted-foreground">{r.owner_user_id ? "Me" : "—"}</span>
        ),
        hideOnTablet: true,
        hidden: visibleCols.owner === false,
      },
      {
        key: "created",
        header: "Created",
        sortKey: "created_at",
        cell: (r) => (
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
          </span>
        ),
        hideOnTablet: true,
        hidden: visibleCols.created === false,
      },
      {
        key: "actions",
        header: "",
        headerClassName: "w-10",
        cell: (row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
                aria-label="Actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => setDetailsFor(row)}>
                <Eye className="mr-2 h-4 w-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDetailsFor(row)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setConfirmDelete(row)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [visibleCols],
  );

  const currentSort = useMemo(() => {
    if (sort === "newest") return { column: "created_at", direction: "desc" as const };
    if (sort === "oldest") return { column: "created_at", direction: "asc" as const };
    if (sort === "name_asc") return { column: "first_name", direction: "asc" as const };
    return { column: "first_name", direction: "desc" as const };
  }, [sort]);

  const handleSortChange = (s: { column: string; direction: "asc" | "desc" }) => {
    const map: ContactSort =
      s.column === "created_at"
        ? s.direction === "asc"
          ? "oldest"
          : "newest"
        : s.direction === "asc"
          ? "name_asc"
          : "name_desc";
    navigate({ to: ".", search: (prev: ContactsSearch) => ({ ...prev, sort: map, page: 1 }) });
  };

  const currentFilters = { q, sort, tagIds, includeArchived };

  const emptyState = (
    <EmptyState
      icon={Users}
      title={q || tagIds.length > 0 ? "No matches found" : "No Contacts Yet"}
      description={
        q || tagIds.length > 0
          ? "Try a different search or filter."
          : "Start by adding your first contact."
      }
      action={
        !q && tagIds.length === 0 ? (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Contact
          </Button>
        ) : undefined
      }
    />
  );

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Manage your contacts and WhatsApp relationships."
        actions={
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button size="sm" variant="outline" disabled>
                    <Upload className="mr-1.5 h-4 w-4" /> Import
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button size="sm" variant="outline" disabled>
                    <Download className="mr-1.5 h-4 w-4" /> Export
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Contact
            </Button>
          </TooltipProvider>
        }
      />

      {isEmpty && !query.isLoading ? (
        <EmptyState
          icon={Users}
          title="No Contacts Yet"
          description="Start by adding your first contact."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Contact
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[220px] flex-1">
              <SearchInput
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search contacts…"
              />
            </div>
            <Select
              value={sort}
              onValueChange={(v) =>
                navigate({
                  to: ".",
                  search: (prev: ContactsSearch) => ({ ...prev, sort: v as ContactSort, page: 1 }),
                })
              }
            >
              <SelectTrigger className="h-9 w-[160px]">
                <ArrowUpDown className="mr-1.5 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="name_asc">Name A→Z</SelectItem>
                <SelectItem value="name_desc">Name Z→A</SelectItem>
              </SelectContent>
            </Select>
            <SavedFiltersMenu
              module="contacts"
              currentFilters={currentFilters}
              activeId={savedFilterId || undefined}
              onApply={(f) => {
                const filters = f.filters as Partial<ContactsSearch>;
                navigate({
                  to: ".",
                  search: (prev: ContactsSearch) => ({
                    ...prev,
                    ...filters,
                    page: 1,
                    savedFilterId: f.id,
                  }),
                });
              }}
              onClear={() =>
                navigate({
                  to: ".",
                  search: (prev: ContactsSearch) => ({
                    ...prev,
                    savedFilterId: undefined,
                    tagIds: undefined,
                    q: undefined,
                    includeArchived: undefined,
                  }),
                })
              }
            />
            <ColumnVisibilityMenu
              columns={COLUMN_OPTIONS}
              visible={visibleCols}
              onChange={setVisibleCols}
            />
            <div className="hidden sm:block">
              <ViewToggle
                value={view}
                onChange={(v) =>
                  navigate({ to: ".", search: (prev: ContactsSearch) => ({ ...prev, view: v }) })
                }
              />
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-card">
            {view === "cards" ? (
              <ContactsCards
                rows={rows}
                loading={query.isLoading}
                emptyState={emptyState}
                onRowClick={setDetailsFor}
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={(p) =>
                  navigate({ to: ".", search: (prev: ContactsSearch) => ({ ...prev, page: p }) })
                }
                onPageSizeChange={(s) =>
                  navigate({
                    to: ".",
                    search: (prev: ContactsSearch) => ({ ...prev, pageSize: s, page: 1 }),
                  })
                }
              />
            ) : (
              <DataTable
                columns={columns}
                rows={rows}
                rowKey={(r) => r.id}
                loading={query.isLoading}
                emptyState={emptyState}
                onRowClick={setDetailsFor}
                page={page}
                pageSize={pageSize}
                total={total}
                stickyHeader
                selectable
                selectedIds={selected}
                onSelectionChange={setSelected}
                sort={currentSort}
                onSortChange={handleSortChange}
                onPageChange={(p) =>
                  navigate({ to: ".", search: (prev: ContactsSearch) => ({ ...prev, page: p }) })
                }
                onPageSizeChange={(s) =>
                  navigate({
                    to: ".",
                    search: (prev: ContactsSearch) => ({ ...prev, pageSize: s, page: 1 }),
                  })
                }
              />
            )}
          </div>
        </div>
      )}

      <ContactDrawer open={addOpen} onOpenChange={setAddOpen} />
      <ContactDetailsDrawer
        open={Boolean(detailsFor)}
        onOpenChange={(o) => !o && setDetailsFor(null)}
        contact={detailsFor}
      />
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete contact?"
        description={`This will permanently remove ${confirmDelete ? displayName(confirmDelete) : ""}.`}
        destructive
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!confirmDelete) return;
          await deleteContact(confirmDelete.id);
          notify.success("Contact deleted.");
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
        }}
      />
      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={`Delete ${selected.size} contacts?`}
        description="This will permanently remove the selected contacts."
        destructive
        confirmLabel="Delete"
        onConfirm={async () => {
          await bulkDeleteContacts(Array.from(selected));
          notify.success("Contacts deleted.");
          setSelected(new Set());
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
        }}
      />

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <AssignTagsPopover
          contactIds={Array.from(selected)}
          onDone={() => setSelected(new Set())}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={async () => {
            await bulkArchiveContacts(Array.from(selected), true);
            notify.success("Contacts archived.");
            setSelected(new Set());
            queryClient.invalidateQueries({ queryKey: ["contacts"] });
          }}
        >
          <Archive className="mr-1.5 h-4 w-4" /> Archive
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmBulkDelete(true)}
        >
          <Trash2 className="mr-1.5 h-4 w-4" /> Delete
        </Button>
      </BulkActionBar>
    </>
  );
}

interface CardsProps {
  rows: ContactWithRelations[];
  loading: boolean;
  emptyState: React.ReactNode;
  onRowClick: (row: ContactWithRelations) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

function ContactsCards({
  rows,
  loading,
  emptyState,
  onRowClick,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: CardsProps) {
  if (!loading && rows.length === 0) return <div className="p-6">{emptyState}</div>;
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-24 animate-pulse bg-muted/40" />
            ))
          : rows.map((r) => (
              <Card
                key={r.id}
                className="cursor-pointer p-4 transition-colors hover:bg-muted/40"
                onClick={() => onRowClick(r)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{initialsFor(r)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{displayName(r)}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.whatsapp_number}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{r.company?.company_name ?? "—"}</span>
                  <span className="truncate text-right">{r.email ?? "—"}</span>
                </div>
              </Card>
            ))}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          Rows per page
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span>
            {total === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(total, page * pageSize)} of{" "}
            {total}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page * pageSize >= total}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function initialsFor(r: ContactWithRelations): string {
  const f = r.first_name?.[0] ?? "";
  const l = r.last_name?.[0] ?? "";
  return (f + l || f || "?").toUpperCase();
}

function displayName(r: ContactWithRelations): string {
  if (r.display_name) return r.display_name;
  return [r.first_name, r.last_name].filter(Boolean).join(" ").trim();
}
