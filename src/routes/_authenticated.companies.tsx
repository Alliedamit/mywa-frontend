import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Building2, Plus, MoreHorizontal, Pencil, Trash2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { SearchInput } from "@/components/common/search-input";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { companiesQueryOptions } from "@/features/crm/queries";
import type { CompanySort, CompanyWithCount } from "@/features/crm/types";
import { CompanyDrawer } from "@/features/crm/components/company-drawer";
import { deleteCompany } from "@/features/crm/mutations";
import { notify } from "@/lib/notify";

const searchSchema = z.object({
  q: z.string().optional().catch(""),
  sort: z.enum(["name_asc", "name_desc", "newest", "oldest"]).optional().catch("name_asc"),
  page: z.number().int().min(1).optional().catch(1),
  pageSize: z.number().int().min(5).max(200).optional().catch(25),
});

type CompaniesSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/_authenticated/companies")({
  validateSearch: (search) => searchSchema.parse(search),
  component: CompaniesPage,
});

function CompaniesPage() {
  const { data: workspace } = useCurrentWorkspace();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const q = search.q ?? "";
  const sort: CompanySort = search.sort ?? "name_asc";
  const page = search.page ?? 1;
  const pageSize = search.pageSize ?? 25;

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyWithCount | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CompanyWithCount | null>(null);
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === q) return;
      navigate({
        to: ".",
        search: (prev: CompaniesSearch) => ({ ...prev, q: searchInput || undefined, page: 1 }),
      });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const query = useQuery({
    ...companiesQueryOptions({ workspaceId: workspace?.id ?? "", q, sort, page, pageSize }),
    enabled: Boolean(workspace?.id),
  });

  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;
  const isEmpty = !query.isLoading && rows.length === 0 && !q;

  const columns = useMemo<DataTableColumn<CompanyWithCount>[]>(
    () => [
      {
        key: "name",
        header: "Company Name",
        sortKey: "company_name",
        cell: (r) => <span className="text-sm font-medium text-foreground">{r.company_name}</span>,
      },
      {
        key: "industry",
        header: "Industry",
        cell: (r) => <span className="text-sm">{r.industry ?? "—"}</span>,
      },
      {
        key: "phone",
        header: "Phone",
        cell: (r) => <span className="text-sm">{r.phone ?? "—"}</span>,
        hideOnTablet: true,
      },
      {
        key: "email",
        header: "Email",
        cell: (r) => <span className="text-sm text-muted-foreground">{r.email ?? "—"}</span>,
      },
      {
        key: "website",
        header: "Website",
        cell: (r) =>
          r.website ? (
            <a
              href={r.website.startsWith("http") ? r.website : `https://${r.website}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Visit <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-sm">—</span>
          ),
        hideOnTablet: true,
      },
      {
        key: "contacts",
        header: "Contacts",
        cell: (r) => <Badge variant="secondary">{r.contacts_count}</Badge>,
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
                aria-label="Actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => setEditing(row)}>
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
    [],
  );

  const emptyState = (
    <EmptyState
      icon={Building2}
      title={q ? "No matches found" : "No Companies Yet"}
      description={
        q ? "Try a different search term." : "Add your first company to organize your contacts."
      }
      action={
        !q ? (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Company
          </Button>
        ) : undefined
      }
    />
  );

  return (
    <>
      <PageHeader
        title="Companies"
        description="Organizations linked to your contacts."
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Company
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={Building2}
          title="No Companies Yet"
          description="Add your first company to organize your contacts."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Company
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
                placeholder="Search companies…"
              />
            </div>
          </div>
          <div className="rounded-lg border border-border/60 bg-card">
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(r) => r.id}
              loading={query.isLoading}
              emptyState={emptyState}
              onRowClick={(r) => setEditing(r)}
              page={page}
              pageSize={pageSize}
              total={total}
              stickyHeader
              sort={
                sort === "name_asc"
                  ? { column: "company_name", direction: "asc" }
                  : sort === "name_desc"
                    ? { column: "company_name", direction: "desc" }
                    : sort === "newest"
                      ? { column: "created_at", direction: "desc" }
                      : { column: "created_at", direction: "asc" }
              }
              onSortChange={(s) => {
                const next: CompanySort =
                  s.column === "company_name"
                    ? s.direction === "asc"
                      ? "name_asc"
                      : "name_desc"
                    : s.direction === "asc"
                      ? "oldest"
                      : "newest";
                navigate({
                  to: ".",
                  search: (prev: CompaniesSearch) => ({ ...prev, sort: next, page: 1 }),
                });
              }}
              onPageChange={(p) =>
                navigate({ to: ".", search: (prev: CompaniesSearch) => ({ ...prev, page: p }) })
              }
              onPageSizeChange={(s) =>
                navigate({
                  to: ".",
                  search: (prev: CompaniesSearch) => ({ ...prev, pageSize: s, page: 1 }),
                })
              }
            />
          </div>
        </div>
      )}

      <CompanyDrawer open={addOpen} onOpenChange={setAddOpen} />
      <CompanyDrawer
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        company={editing}
      />
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete company?"
        description="Contacts linked to this company will be unlinked, not deleted."
        destructive
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!confirmDelete) return;
          await deleteCompany(confirmDelete.id);
          notify.success("Company deleted.");
          queryClient.invalidateQueries({ queryKey: ["companies"] });
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
        }}
      />
    </>
  );
}
