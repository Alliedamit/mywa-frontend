import { Link } from "@tanstack/react-router";
import { formatDistanceToNowStrict } from "date-fns";
import { Pin, BellOff, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { contactDisplay, contactInitials, type ConversationWithContact } from "../types";

interface Props {
  conversation: ConversationWithContact;
  active: boolean;
}

export function ConversationCard({ conversation: c, active }: Props) {
  const name = contactDisplay(c.contact);
  const preview = c.last_message_preview ?? "No messages yet";
  const time = c.last_message_at
    ? formatDistanceToNowStrict(new Date(c.last_message_at), { addSuffix: false })
    : "";

  return (
    <Link
      to="/inbox/$conversationId"
      params={{ conversationId: c.id }}
      className={cn(
        "flex w-full items-start gap-3 border-b border-border/40 px-3 py-3 transition-colors hover:bg-muted/50",
        active && "bg-muted",
      )}
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="text-xs">{contactInitials(c.contact)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">{name}</p>
          {time ? (
            <span
              className={cn(
                "shrink-0 text-[10.5px] uppercase tracking-wide",
                c.unread_count > 0 ? "text-primary font-semibold" : "text-muted-foreground",
              )}
            >
              {time}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-xs",
              c.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground",
            )}
          >
            {preview}
          </p>
          <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
            {c.is_pinned ? <Pin className="h-3 w-3" /> : null}
            {c.is_muted ? <BellOff className="h-3 w-3" /> : null}
            {c.assigned_user_id ? <UserCheck className="h-3 w-3" /> : null}
            {c.unread_count > 0 ? (
              <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
                {c.unread_count > 99 ? "99+" : c.unread_count}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
