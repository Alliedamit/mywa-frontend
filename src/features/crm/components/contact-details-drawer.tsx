import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Pencil, MessageSquare } from "lucide-react";

import { AppDrawer } from "@/components/common/app-drawer";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { notify } from "@/lib/notify";
import { deleteContact } from "../mutations";
import type { ContactWithRelations } from "../types";
import { ContactDrawer } from "./contact-drawer";
import { NotesPanel } from "./notes-panel";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactWithRelations | null;
}

export function ContactDetailsDrawer({ open, onOpenChange, contact }: Props) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!contact) return;
      await deleteContact(contact.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      notify.success("Contact deleted.");
      onOpenChange(false);
    },
    onError: (e: unknown) => notify.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  const initials = getInitials(contact);
  const fullName = displayFor(contact);

  return (
    <>
      <AppDrawer
        open={open && !editOpen}
        onOpenChange={onOpenChange}
        title="Contact details"
        footer={
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmOpen(true)}
              disabled={!contact}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button size="sm" onClick={() => setEditOpen(true)} disabled={!contact}>
                <Pencil className="mr-1.5 h-4 w-4" /> Edit
              </Button>
            </div>
          </div>
        }
      >
        {contact ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold tracking-tight">{fullName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {contact.designation ?? "—"}
                  {contact.company ? ` · ${contact.company.company_name}` : ""}
                </p>
              </div>
            </div>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Details</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="mt-4">
                <div className="flex flex-col divide-y divide-border/60 rounded-md border border-border/60">
                  <Row label="WhatsApp" value={contact.whatsapp_number} />
                  <Row label="Email" value={contact.email ?? "—"} />
                  <Row label="Company" value={contact.company?.company_name ?? "—"} />
                  <Row label="Designation" value={contact.designation ?? "—"} />
                  <Row label="Display name" value={contact.display_name ?? "—"} />
                  <Row label="Created" value={new Date(contact.created_at).toLocaleString()} />
                </div>
              </TabsContent>
              <TabsContent value="activity" className="mt-4">
                <EmptyState
                  icon={MessageSquare}
                  title="No activity yet"
                  description="Activity will appear here once messaging is connected."
                />
              </TabsContent>
              <TabsContent value="notes" className="mt-4">
                {contact ? <NotesPanel contactId={contact.id} /> : null}
              </TabsContent>
            </Tabs>
            <Separator />
          </div>
        ) : null}
      </AppDrawer>

      <ContactDrawer open={editOpen} onOpenChange={setEditOpen} contact={contact} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete contact?"
        description="This action cannot be undone."
        destructive
        confirmLabel="Delete"
        onConfirm={() => deleteMutation.mutateAsync()}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-3 px-3 py-2.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="truncate text-sm text-foreground">{value}</span>
    </div>
  );
}

function getInitials(contact: ContactWithRelations | null): string {
  if (!contact) return "?";
  const first = contact.first_name?.[0] ?? "";
  const last = contact.last_name?.[0] ?? "";
  return (first + last || first || "?").toUpperCase();
}

function displayFor(contact: ContactWithRelations | null): string {
  if (!contact) return "—";
  if (contact.display_name) return contact.display_name;
  return [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim();
}
