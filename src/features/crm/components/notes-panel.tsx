import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { notify } from "@/lib/notify";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { notesQueryOptions } from "../notes.queries";
import { createNote, deleteNote } from "../notes.mutations";

interface Props {
  contactId: string;
}

export function NotesPanel({ contactId }: Props) {
  const { data: workspace } = useCurrentWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const notesQ = useQuery(notesQueryOptions(contactId));

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!workspace || !user) throw new Error("Missing workspace or user");
      const trimmed = text.trim();
      if (!trimmed) return;
      await createNote({
        workspaceId: workspace.id,
        contactId,
        createdBy: user.id,
        note: trimmed,
      });
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["notes", contactId] });
    },
    onError: (e: unknown) => notify.error(e instanceof Error ? e.message : "Failed to add note"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => {
      notify.success("Note deleted.");
      qc.invalidateQueries({ queryKey: ["notes", contactId] });
    },
  });

  const notes = notesQ.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-border/60 p-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a note…"
          rows={3}
          className="min-h-[64px] resize-none border-0 p-1 focus-visible:ring-0"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") addMutation.mutate();
          }}
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">⌘/Ctrl + Enter to submit</span>
          <Button
            size="sm"
            onClick={() => addMutation.mutate()}
            disabled={!text.trim() || addMutation.isPending}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" /> Add note
          </Button>
        </div>
      </div>

      {notesQ.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : notes.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No notes yet. Add the first one above.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="group rounded-md border border-border/60 bg-card px-3 py-2 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="flex-1 whitespace-pre-wrap break-words text-sm text-foreground">
                  {n.note}
                </p>
                {n.created_by === user?.id ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => removeMutation.mutate(n.id)}
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                ) : null}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{n.author?.full_name ?? "Someone"}</span>
                <span>·</span>
                <span>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
