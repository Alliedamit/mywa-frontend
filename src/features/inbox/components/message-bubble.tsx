import { format } from "date-fns";
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  Video,
  FileText,
  Mic,
  Sticker,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageWithAttachments } from "../types";

interface Props {
  message: MessageWithAttachments;
}

const TYPE_ICON = {
  image: ImageIcon,
  video: Video,
  document: FileText,
  audio: Mic,
  sticker: Sticker,
  location: MapPin,
} as const;

export function MessageBubble({ message: m }: Props) {
  if (m.sender_type === "system" || m.message_type === "system") {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
          {m.text ?? "System message"}
        </span>
      </div>
    );
  }

  const outgoing = m.direction === "outbound";
  const time = format(new Date(m.sent_at), "h:mm a");

  return (
    <div className={cn("flex w-full", outgoing ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm",
          outgoing
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm",
        )}
      >
        {m.reply_to ? (
          <div
            className={cn(
              "mb-1.5 rounded-md border-l-2 px-2 py-1 text-[11px]",
              outgoing
                ? "border-primary-foreground/40 bg-primary-foreground/10"
                : "border-foreground/30 bg-foreground/5",
            )}
          >
            <p className="line-clamp-2 opacity-80">{m.reply_to.text ?? "Attachment"}</p>
          </div>
        ) : null}

        {m.message_type !== "text" ? (
          <MediaPlaceholder type={m.message_type} name={m.attachments?.[0]?.file_name ?? null} />
        ) : null}

        {m.text ? (
          <p className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
        ) : null}

        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[10px]",
            outgoing ? "text-primary-foreground/75" : "text-muted-foreground",
          )}
        >
          <span>{time}</span>
          {outgoing ? <StatusIcon status={m.status} /> : null}
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: MessageWithAttachments["status"] }) {
  if (status === "pending") return <Clock className="h-3 w-3" />;
  if (status === "sent") return <Check className="h-3 w-3" />;
  if (status === "delivered") return <CheckCheck className="h-3 w-3" />;
  if (status === "read") return <CheckCheck className="h-3 w-3 text-sky-300" />;
  if (status === "failed") return <AlertCircle className="h-3 w-3 text-destructive" />;
  return null;
}

function MediaPlaceholder({
  type,
  name,
}: {
  type: MessageWithAttachments["message_type"];
  name: string | null;
}) {
  const Icon = TYPE_ICON[type as keyof typeof TYPE_ICON] ?? FileText;
  return (
    <div className="mb-1 flex items-center gap-2 rounded-md bg-background/20 px-2 py-2">
      <Icon className="h-4 w-4 opacity-80" />
      <span className="truncate text-xs opacity-90">{name ?? type}</span>
    </div>
  );
}
