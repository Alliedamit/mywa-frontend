import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Waypoints } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { SearchInput } from "@/components/common/search-input";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notify } from "@/lib/notify";
import { useCurrentWorkspace } from "@/hooks/use-workspace";

import { flowsListQueryOptions } from "@/features/flows/queries";
import type { FlowRow, FlowStatus } from "@/features/flows/types";
import { STATUS_FILTERS } from "@/features/flows/constants";
import { archiveFlow, duplicateFlow, setFlowStatus } from "@/features/flows/mutations";
import { FlowStatusBadge } from "@/features/flows/components/FlowStatusBadge";
import { TriggerBadge } from "@/features/flows/components/TriggerBadge";
import { FlowActionsMenu } from "@/features/flows/components/FlowActionsMenu";
import { FlowDrawer } from "@/features/flows/components/FlowDrawer";
import { FlowDetailsDrawer } from "@/features/flows/components/FlowDetailsDrawer";
import { FlowTestDialog } from "@/features/flows/components/FlowTestDialog";

export const Route = createFileRoute("/_authenticated/flows")({
  component: FlowsPage,
});

function FlowsPage() {
  const { data: workspace } = useCurrentWorkspace();
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<FlowStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<FlowRow | null>(null);
  const [detailsFlow, setDetailsFlow] = useState<FlowRow | null>(null);
  const [testingFlow, setTestingFlow] = useState<FlowRow | null>(null);

  const listQ = useQuery({
    ...flowsListQueryOptions({ workspaceId: workspace?.id ?? "", q, status }),
    enabled: Boolean(workspace?.id),
  });

  const rows = listQ.data ?? [];
  const paged = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page, pageSize],
  );

  const toggleMut = useMutation({
    mutationFn: async (flow: FlowRow) => {
      const next: FlowStatus = flow.status === "active" ? "paused" : "active";
      await setFlowStatus(flow.id, next);
      return next;
    },
    onSuccess: (next) => {
      qc.invalidateQueries({ queryKey: ["flows"] });
      notify.success(next === "active" ? "Flow enabled." : "Flow paused.");
    },
    onError: (e: unknown) => notify.error(e instanceof Error ? e.message : "Failed"),
  });

  const dupMut = useMutation({
    mutationFn: (flow: FlowRow) => duplicateFlow(flow),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flows"] });
      notify.success("Flow duplicated.");
    },
    onError: (e: unknown) => notify.error(e instanceof Error ? e.message : "Failed"),
  });

  const archiveMut = useMutation({
    mutationFn: (flow: FlowRow) => archiveFlow(flow.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flows"] });
      notify.success("Flow archived.");
    },
    onError: (e: unknown) => notify.error(e instanceof Error ? e.message : "Failed"),
  });

  const columns: DataTableColumn<FlowRow>[] = [
    {
      key: "name",
      header: "Flow",
      cell: (f) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{f.name}</span>
          {f.description ? (
            <span className="truncate text-xs text-muted-foreground">{f.description}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "trigger",
      header: "Trigger",
      cell: (f) => <TriggerBadge trigger={f.trigger} />,
      hideOnTablet: false,
    },
    {
      key: "status",
      header: "Status",
      cell: (f) => <FlowStatusBadge status={f.status} />,
    },
    {
      key: "last_run",
      header: "Last run",
      hideOnTablet: true,
      cell: (f) => (
        <span className="text-xs text-muted-foreground">
          {f.last_run_at ? formatDistanceToNow(new Date(f.last_run_at), { addSuffix: true }) : "—"}
        </span>
      ),
    },
    {
      key: "runs",
      header: "Runs",
      hideOnTablet: true,
      cell: (f) => <span className="text-xs tabular-nums">{f.run_count}</span>,
    },
    {
      key: "created",
      header: "Created",
      hideOnTablet: true,
      cell: (f) => (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-10",
      className: "w-10 text-right",
      cell: (f) => (
        <FlowActionsMenu
          flow={f}
          onView={setDetailsFlow}
          onEdit={(flow) => {
            setEditing(flow);
            setDrawerOpen(true);
          }}
          onTest={setTestingFlow}
          onToggle={(flow) => toggleMut.mutate(flow)}
          onDuplicate={(flow) => dupMut.mutate(flow)}
          onArchive={(flow) => archiveMut.mutate(flow)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Flows"
        description="Automate repetitive WhatsApp tasks."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> New flow
          </Button>
        }
      />

      <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
        <div className="flex-1 sm:max-w-sm">
          <SearchInput
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search flows…"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as FlowStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="px-2 sm:px-4">
        <DataTable
          columns={columns}
          rows={paged}
          rowKey={(f) => f.id}
          loading={listQ.isLoading}
          onRowClick={(f) => setDetailsFlow(f)}
          page={page}
          pageSize={pageSize}
          total={rows.length}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          stickyHeader
          emptyState={
            <EmptyState
              icon={Waypoints}
              title={q || status !== "all" ? "No matching flows" : "No flows yet"}
              description={
                q || status !== "all"
                  ? "Try adjusting your search or filter."
                  : "Create your first automation to react to keywords, tags or schedules."
              }
              action={
                !q && status === "all" ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditing(null);
                      setDrawerOpen(true);
                    }}
                  >
                    <Plus className="mr-1.5 h-4 w-4" /> New flow
                  </Button>
                ) : undefined
              }
            />
          }
        />
      </div>

      <FlowDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setEditing(null);
        }}
        flow={editing}
      />
      <FlowDetailsDrawer
        open={Boolean(detailsFlow)}
        onOpenChange={(open) => {
          if (!open) setDetailsFlow(null);
        }}
        flow={detailsFlow}
      />
      <FlowTestDialog
        open={Boolean(testingFlow)}
        onOpenChange={(open) => {
          if (!open) setTestingFlow(null);
        }}
        flow={testingFlow}
      />
    </>
  );
}
