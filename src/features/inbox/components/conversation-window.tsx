import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  MoreVertical,
  Search,
  ArrowLeft,
  Archive,
  BellOff,
  Bell,
  Pin,
  PinOff,
  CheckCheck,
  Trash2,
  Info,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { TagChip } from "@/components/common/tag-chip";
import { SearchInput } from "@/components/common/search-input";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

import type { ConversationWithContact } from "../types";
import { contactDisplay, contactInitials } from "../types";
import { messagesQueryOptions } from "../queries";
import { deleteConversation, markRead, toggleArchive, toggleMute, togglePin } from "../mutations";
import { MessageList } from "./message-list";
import { MessageComposer } from "./message-composer";

interface Props {
  conversation: ConversationWithContact;
  onOpenContactPanel?: () => void;
  showBack?: boolean;
}

export function ConversationWindow({ conversation, onOpenContactPanel, showBack }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const msgs = useQuery(messagesQueryOptions(conversation.id));

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["conversations"] });
    qc.invalidateQueries({ queryKey: ["conversation", conversation.id] });
  };

  const runMutation = (fn: () => Promise<void>, msg?: string) =>
    fn()
      .then(() => {
        if (msg) notify.success(msg);
        invalidate();
      })
      .catch((e) => notify.error(e instanceof Error ? e.message : "Action failed"));

  const del = useMutation({
    mutationFn: () => deleteConversation(conversation.id),
    onSuccess: () => {
      notify.success("Conversation deleted.");
      qc.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/inbox", search: (p: Record<string, unknown>) => p });
    },
    onError: (e: unknown) => notify.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  const contact = conversation.contact;
  const tags = (contact?.contact_tags ?? []).flatMap((t) => (t.tag ? [t.tag] : []));
  const filtered = (msgs.data ?? []).filter((m) =>
    search.trim() ? (m.text ?? "").toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border/60 px-3 py-2.5 md:px-4">
        {showBack ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            aria-label="Back"
            onClick={() => navigate({ to: "/inbox", search: (p: Record<string, unknown>) => p })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : null}
        <button
          type="button"
          onClick={onOpenContactPanel}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md p-1 text-left transition-colors hover:bg-muted"
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="text-xs">{contactInitials(contact)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{contactDisplay(contact)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {contact?.company?.company_name ?? contact?.whatsapp_number ?? ""}
            </p>
          </div>
          {tags.length ? (
            <div className="hidden max-w-[220px] items-center gap-1 overflow-hidden lg:flex">
              {tags.slice(0, 3).map((t) => (
                <TagChip key={t.id} name={t.name} color={t.color} />
              ))}
            </div>
          ) : null}
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Search messages"
          onClick={() => setSearchOpen((v) => !v)}
        >
          <Search className="h-4 w-4" />
        </Button>
        {onOpenContactPanel ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            aria-label="Contact details"
            onClick={onOpenContactPanel}
          >
            <Info className="h-4 w-4" />
          </Button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onClick={() =>
                runMutation(
                  () => togglePin(conversation.id, !conversation.is_pinned),
                  conversation.is_pinned ? "Unpinned." : "Pinned.",
                )
              }
            >
              {conversation.is_pinned ? (
                <PinOff className="mr-2 h-4 w-4" />
              ) : (
                <Pin className="mr-2 h-4 w-4" />
              )}
              {conversation.is_pinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                runMutation(
                  () => toggleMute(conversation.id, !conversation.is_muted),
                  conversation.is_muted ? "Unmuted." : "Muted.",
                )
              }
            >
              {conversation.is_muted ? (
                <Bell className="mr-2 h-4 w-4" />
              ) : (
                <BellOff className="mr-2 h-4 w-4" />
              )}
              {conversation.is_muted ? "Unmute" : "Mute"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => runMutation(() => markRead(conversation.id), "Marked as read.")}
            >
              <CheckCheck className="mr-2 h-4 w-4" /> Mark as read
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                runMutation(
                  () => toggleArchive(conversation.id, !conversation.is_archived),
                  conversation.is_archived ? "Unarchived." : "Archived.",
                )
              }
            >
              <Archive className="mr-2 h-4 w-4" />
              {conversation.is_archived ? "Unarchive" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {searchOpen ? (
        <div className="border-b border-border/60 bg-background/80 px-3 py-2 md:px-4">
          <SearchInput
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search in conversation…"
          />
        </div>
      ) : null}

      <div className={cn("min-h-0 flex-1 overflow-y-auto")}>
        <MessageList messages={filtered} loading={msgs.isLoading} />
      </div>

      <MessageComposer workspaceId={conversation.workspace_id} conversationId={conversation.id} />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete conversation?"
        description="This will remove the conversation and all its messages. This cannot be undone."
        destructive
        confirmLabel="Delete"
        onConfirm={() => del.mutateAsync()}
      />
    </div>
  );
}
