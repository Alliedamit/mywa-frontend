import { useEffect, useMemo, useRef } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { MessageWithAttachments } from "../types";
import { MessageBubble } from "./message-bubble";

interface Props {
  messages: MessageWithAttachments[];
  loading: boolean;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMM d, yyyy");
}

type Item =
  | { kind: "sep"; key: string; label: string }
  | { kind: "msg"; key: string; msg: MessageWithAttachments };

export function MessageList({ messages, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const items: Item[] = useMemo(() => {
    const out: Item[] = [];
    let lastDay = "";
    for (const m of messages) {
      const label = dayLabel(m.sent_at);
      if (label !== lastDay) {
        out.push({ kind: "sep", key: `sep-${label}-${m.id}`, label });
        lastDay = label;
      }
      out.push({ kind: "msg", key: m.id, msg: m });
    }
    return out;
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="ml-auto h-10 w-1/2" />
        <Skeleton className="h-10 w-1/3" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No messages yet"
        description="Messages exchanged with this contact will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      {items.map((it) =>
        it.kind === "sep" ? (
          <div key={it.key} className="my-2 flex justify-center">
            <span className="rounded-full bg-muted px-3 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {it.label}
            </span>
          </div>
        ) : (
          <MessageBubble key={it.key} message={it.msg} />
        ),
      )}
      <div ref={bottomRef} />
    </div>
  );
}
