import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Loader2, MessageCircle, Plug } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { notify } from "@/lib/notify";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { waApi } from "@/features/whatsapp/client";
import { isBackendConfigured } from "@/features/whatsapp/config";
import { sessionQueryOptions, syncStateQueryOptions } from "@/features/whatsapp/queries";
import { useWhatsAppRealtime } from "@/features/whatsapp/use-whatsapp-realtime";
import { useWhatsAppSocket } from "@/features/whatsapp/use-whatsapp-socket";
import { ConnectionStatusCard } from "@/features/whatsapp/components/ConnectionStatusCard";
import { QrPanel } from "@/features/whatsapp/components/QrPanel";
import { SyncProgress } from "@/features/whatsapp/components/SyncProgress";

export const Route = createFileRoute("/_authenticated/integrations")({
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const ws = useCurrentWorkspace();
  const workspaceId = ws.data?.id;

  useWhatsAppRealtime(workspaceId);
  useWhatsAppSocket(workspaceId);

  const sessionQ = useQuery(sessionQueryOptions(workspaceId));
  const syncQ = useQuery(syncStateQueryOptions(workspaceId));

  const [busy, setBusy] = useState(false);

  const connect = useMutation({
    mutationFn: () => waApi.connect(workspaceId!),
    onMutate: () => setBusy(true),
    onSettled: () => setBusy(false),
    onError: (e) => notify.error(e instanceof Error ? e.message : "Failed to start WhatsApp"),
  });
  const disconnect = useMutation({
    mutationFn: () => waApi.disconnect(workspaceId!),
    onMutate: () => setBusy(true),
    onSettled: () => setBusy(false),
    onSuccess: () => notify.success("WhatsApp disconnected"),
    onError: (e) => notify.error(e instanceof Error ? e.message : "Failed to disconnect"),
  });
  const reconnect = useMutation({
    mutationFn: () => waApi.reconnect(workspaceId!),
    onMutate: () => setBusy(true),
    onSettled: () => setBusy(false),
    onError: (e) => notify.error(e instanceof Error ? e.message : "Failed to reconnect"),
  });

  const sync = useMutation({
    mutationFn: () => waApi.triggerSync(workspaceId!),
    onMutate: () => setBusy(true),
    onSettled: () => setBusy(false),
    onSuccess: () => notify.success("Sync started"),
    onError: (e) => notify.error(e instanceof Error ? e.message : "Failed to trigger sync"),
  });

  return (
    <>
      <PageHeader title="Integrations" description="Connect WhatsApp, CRMs, and other tools." />

      {!isBackendConfigured() ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" />
            WhatsApp backend not configured
          </div>
          <p className="text-muted-foreground">
            Deploy the Node.js WhatsApp backend (see{" "}
            <code className="rounded bg-background/60 px-1">backend/README.md</code>), then set{" "}
            <code className="rounded bg-background/60 px-1">VITE_WHATSAPP_BACKEND_URL</code> and{" "}
            <code className="rounded bg-background/60 px-1">VITE_WHATSAPP_BACKEND_TOKEN</code> in
            your project secrets.
          </p>
        </div>
      ) : sessionQ.isLoading || ws.isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : (
        <div className="space-y-6">
          <WhatsAppSection
            status={sessionQ.data?.status ?? "disconnected"}
            qr={sessionQ.data?.qr ?? null}
            qrExpiresAt={sessionQ.data?.qr_expires_at ?? null}
            session={sessionQ.data ?? null}
            lastError={sessionQ.data?.last_error ?? null}
            busy={busy || connect.isPending || disconnect.isPending || reconnect.isPending || sync.isPending}
            onConnect={() => connect.mutate()}
            onDisconnect={() => disconnect.mutate()}
            onReconnect={() => reconnect.mutate()}
            onSync={() => sync.mutate()}
          />
          <SyncProgress sync={syncQ.data ?? null} />
        </div>
      )}
    </>
  );
}

interface SectionProps {
  status: string;
  qr: string | null;
  qrExpiresAt: string | null;
  session: import("@/features/whatsapp/types").WhatsAppSession | null;
  lastError: string | null;
  busy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onReconnect: () => void;
  onSync?: () => void;
}

function WhatsAppSection({
  status,
  qr,
  qrExpiresAt,
  session,
  lastError,
  busy,
  onConnect,
  onDisconnect,
  onReconnect,
  onSync,
}: SectionProps) {
  if (status === "connected" && session) {
    return (
      <ConnectionStatusCard
        session={session}
        onReconnect={onReconnect}
        onDisconnect={onDisconnect}
        onSync={onSync}
        busy={busy}
      />
    );
  }

  if (status === "qr_ready" || (status === "connecting" && qr)) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          <QrPanel qr={qr} expiresAt={qrExpiresAt} />
          <div className="flex-1 space-y-3">
            <h3 className="text-lg font-semibold tracking-tight">Scan to connect WhatsApp</h3>
            <p className="text-sm text-muted-foreground">
              Keep this page open while you scan. Once connected we'll sync your contacts and
              conversations automatically.
            </p>
            <Button variant="outline" size="sm" onClick={onDisconnect} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "connecting" || status === "reconnecting") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin" />
        <div>
          <p className="font-medium">
            {status === "reconnecting" ? "Reconnecting" : "Starting WhatsApp"}
          </p>
          <p className="text-sm text-muted-foreground">This can take a few seconds…</p>
        </div>
      </div>
    );
  }

  const failed = status === "failed" || status === "expired";
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
      <EmptyState
        icon={failed ? Plug : MessageCircle}
        title={
          failed
            ? status === "expired"
              ? "Session expired"
              : "Connection failed"
            : "Connect WhatsApp"
        }
        description={
          failed
            ? (lastError ?? "Reconnect to link your WhatsApp account again.")
            : "Link your personal WhatsApp using WhatsApp Web to sync contacts and conversations into MyWA."
        }
        action={
          <Button onClick={onConnect} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {failed ? "Reconnect WhatsApp" : "Connect WhatsApp"}
          </Button>
        }
      />
    </div>
  );
}
