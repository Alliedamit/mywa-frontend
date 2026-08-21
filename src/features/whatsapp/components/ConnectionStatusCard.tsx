import { formatDistanceToNowStrict } from "date-fns";
import { CheckCircle2, PhoneOff, RefreshCw, Smartphone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WhatsAppSession } from "../types";

interface Props {
  session: WhatsAppSession;
  onReconnect: () => void;
  onDisconnect: () => void;
  onSync?: () => void;
  busy?: boolean;
}

export function ConnectionStatusCard({ session, onReconnect, onDisconnect, onSync, busy }: Props) {
  const name = session.profile_name ?? "WhatsApp account";
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {session.profile_picture_url ? (
              <AvatarImage src={session.profile_picture_url} alt={name} />
            ) : null}
            <AvatarFallback>{initials || "WA"}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold tracking-tight">{name}</p>
              <Badge variant="secondary" className="gap-1 text-[10px] uppercase tracking-wide">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </Badge>
            </div>
            {session.phone_number ? (
              <p className="text-sm text-muted-foreground">+{session.phone_number}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {session.platform ? (
                <span className="inline-flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  {session.platform}
                </span>
              ) : null}
              {session.connected_at ? (
                <span>
                  Connected{" "}
                  {formatDistanceToNowStrict(new Date(session.connected_at), { addSuffix: true })}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onSync ? (
            <Button variant="outline" size="sm" onClick={onSync} disabled={busy}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Sync Data
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={onReconnect} disabled={busy}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Reconnect
          </Button>
          <Button variant="destructive" size="sm" onClick={onDisconnect} disabled={busy}>
            <PhoneOff className="mr-1.5 h-3.5 w-3.5" /> Disconnect
          </Button>
        </div>
      </div>
    </div>
  );
}
