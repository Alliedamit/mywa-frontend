import { Activity, FileIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/empty-state";
import { TagChip } from "@/components/common/tag-chip";
import { NotesPanel } from "@/features/crm/components/notes-panel";
import { contactDisplay, contactInitials, type ConversationContactRef } from "../types";

interface Props {
  contact: ConversationContactRef | null;
}

export function ContactPanel({ contact }: Props) {
  if (!contact) return null;
  const tags = (contact.contact_tags ?? []).flatMap((t) => (t.tag ? [t.tag] : []));

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-border/60 bg-background">
      <div className="border-b border-border/60 px-5 py-5">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-16 w-16">
            <AvatarFallback>{contactInitials(contact)}</AvatarFallback>
          </Avatar>
          <p className="mt-3 text-base font-semibold tracking-tight">{contactDisplay(contact)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{contact.whatsapp_number}</p>
          {tags.length ? (
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              {tags.map((t) => (
                <TagChip key={t.id} name={t.name} color={t.color} />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-4 mt-3 grid grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <TabsContent value="overview" className="m-0 space-y-1">
            <div className="rounded-md border border-border/60 divide-y divide-border/60">
              <Row label="WhatsApp" value={contact.whatsapp_number} />
              <Row label="Email" value={contact.email ?? "—"} />
              <Row label="Company" value={contact.company?.company_name ?? "—"} />
              <Row label="Designation" value={contact.designation ?? "—"} />
            </div>
          </TabsContent>
          <TabsContent value="notes" className="m-0">
            <NotesPanel contactId={contact.id} />
          </TabsContent>
          <TabsContent value="activity" className="m-0">
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Recent contact activity will appear here."
              className="min-h-0 py-10"
            />
          </TabsContent>
          <TabsContent value="files" className="m-0">
            <EmptyState
              icon={FileIcon}
              title="No files shared"
              description="Files exchanged in this conversation will appear here."
              className="min-h-0 py-10"
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-3 px-3 py-2.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="truncate text-sm">{value}</span>
    </div>
  );
}
