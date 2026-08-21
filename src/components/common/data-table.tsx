import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  hideOnTablet?: boolean;
  hidden?: boolean;
  sortKey?: string;
}

export interface SortState {
  column: string;
  direction: "asc" | "desc";
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  stickyHeader?: boolean;
  // selection
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  // sorting
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyState,
  onRowClick,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  stickyHeader,
  selectable,
  selectedIds,
  onSelectionChange,
  sort,
  onSortChange,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const visibleColumns = columns.filter((c) => !c.hidden);

  const allSelected =
    selectable && rows.length > 0 && rows.every((r) => selectedIds?.has(rowKey(r)));
  const someSelected = selectable && rows.some((r) => selectedIds?.has(rowKey(r)));

  const toggleAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    for (const r of rows) {
      const id = rowKey(r);
      if (checked) next.add(id);
      else next.delete(id);
    }
    onSelectionChange(next);
  };

  const toggleOne = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectionChange(next);
  };

  const handleSort = (col: DataTableColumn<T>) => {
    if (!col.sortKey || !onSortChange) return;
    if (sort?.column === col.sortKey) {
      onSortChange({ column: col.sortKey, direction: sort.direction === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ column: col.sortKey, direction: "asc" });
    }
  };

  const colSpan = visibleColumns.length + (selectable ? 1 : 0);

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className={cn(stickyHeader && "sticky top-0 z-10 bg-card")}>
            <TableRow>
              {selectable ? (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={(v) => toggleAll(v === true)}
                    aria-label="Select all on page"
                  />
                </TableHead>
              ) : null}
              {visibleColumns.map((col) => {
                const isSortable = Boolean(col.sortKey && onSortChange);
                const active = sort?.column === col.sortKey;
                return (
                  <TableHead
                    key={col.key}
                    className={cn(
                      col.headerClassName,
                      col.hideOnTablet && "hidden lg:table-cell",
                      isSortable && "cursor-pointer select-none",
                    )}
                    onClick={isSortable ? () => handleSort(col) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {isSortable ? (
                        active ? (
                          sort?.direction === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )
                      ) : null}
                    </span>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {selectable ? (
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  ) : null}
                  {visibleColumns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(col.hideOnTablet && "hidden lg:table-cell")}
                    >
                      <Skeleton className="h-4 w-full max-w-[160px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="p-0">
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const id = rowKey(row);
                const selected = selectedIds?.has(id);
                return (
                  <TableRow
                    key={id}
                    data-state={selected ? "selected" : undefined}
                    className={onRowClick ? "cursor-pointer" : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selectable ? (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected}
                          onCheckedChange={(v) => toggleOne(id, v === true)}
                          aria-label="Select row"
                        />
                      </TableCell>
                    ) : null}
                    {visibleColumns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn(col.className, col.hideOnTablet && "hidden lg:table-cell")}
                      >
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col-reverse items-start justify-between gap-3 border-t border-border/60 px-3 py-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            {from}-{to} of {total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
