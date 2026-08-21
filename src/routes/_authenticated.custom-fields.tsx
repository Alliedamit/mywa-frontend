import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Settings2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import { customFieldsQueryOptions } from "@/features/crm/custom-fields.queries";
import { deleteCustomField } from "@/features/crm/custom-fields.mutations";
import { CustomFieldDrawer } from "@/features/crm/components/custom-field-drawer";
import type { CustomFieldModule, CustomFieldRow } from "@/features/crm/types";
import { notify } from "@/lib/notify";

export const Route = createFileRoute("/_authenticated/custom-fields")({
  component: CustomFieldsPage,
});

function CustomFieldsPage() {
  const [module, setModule] = useState<CustomFieldModule>("contact");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<CustomFieldRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CustomFieldRow | null>(null);

  return (
    <>
      <PageHeader
        title="Custom fields"
        description="Extend contacts and companies with your own fields."
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New field
          </Button>
        }
      />
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
        <Tabs value={module} onValueChange={(v) => setModule(v as CustomFieldModule)}>
          <TabsList>
            <TabsTrigger value="contact">Contacts</TabsTrigger>
            <TabsTrigger value="company">Companies</TabsTrigger>
          </TabsList>
          <TabsContent value="contact" className="mt-4">
            <FieldsList
              module="contact"
              onEdit={setEditing}
              onDelete={setConfirmDelete}
              onAdd={() => setAddOpen(true)}
            />
          </TabsContent>
          <TabsContent value="company" className="mt-4">
            <FieldsList
              module="company"
              onEdit={setEditing}
              onDelete={setConfirmDelete}
              onAdd={() => setAddOpen(true)}
            />
          </TabsContent>
        </Tabs>
      </div>

      <CustomFieldDrawer open={addOpen} onOpenChange={setAddOpen} module={module} />
      <CustomFieldDrawer
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        module={editing?.module ?? module}
        field={editing}
      />
      <DeleteConfirm target={confirmDelete} onClose={() => setConfirmDelete(null)} />
    </>
  );
}

function FieldsList({
  module,
  onEdit,
  onDelete,
  onAdd,
}: {
  module: CustomFieldModule;
  onEdit: (f: CustomFieldRow) => void;
  onDelete: (f: CustomFieldRow) => void;
  onAdd: () => void;
}) {
  const { data: workspace } = useCurrentWorkspace();
  const q = useQuery({
    ...customFieldsQueryOptions(workspace?.id ?? "", module),
    enabled: Boolean(workspace?.id),
  });

  if (q.isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }
  const rows = q.data ?? [];
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Settings2}
        title={`No custom fields for ${module === "contact" ? "contacts" : "companies"} yet`}
        description="Custom fields let you capture the data your business needs."
        action={
          <Button onClick={onAdd}>
            <Plus className="mr-1.5 h-4 w-4" /> New field
          </Button>
        }
      />
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((f) => (
        <Card key={f.id} className="flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{f.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {(f.options.choices ?? []).join(", ") || (f.options.currency ?? "")}
            </p>
          </div>
          <Badge variant="secondary" className="capitalize">
            {f.type}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(f)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(f)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Card>
      ))}
    </div>
  );
}

function DeleteConfirm({
  target,
  onClose,
}: {
  target: CustomFieldRow | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  return (
    <ConfirmDialog
      open={Boolean(target)}
      onOpenChange={(o) => !o && onClose()}
      title="Delete custom field?"
      description="All values stored for this field will be removed. This cannot be undone."
      destructive
      confirmLabel="Delete"
      onConfirm={async () => {
        if (!target) return;
        await deleteCustomField(target.id);
        notify.success("Field deleted.");
        qc.invalidateQueries({ queryKey: ["custom-fields"] });
      }}
    />
  );
}
