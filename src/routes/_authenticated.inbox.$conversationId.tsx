import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquareX } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversationWindow } from "@/features/inbox/components/conversation-window";
import { ContactPanel } from "@/features/inbox/components/contact-panel";
import { conversationQueryOptions } from "@/features/inbox/queries";
import { markRead } from "@/features/inbox/mutations";
import { useIsMobile } from "@/hooks/use-mobile";

function ConversationErrorComponent({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <ErrorState
      title="Couldn't load conversation"
      description="Something went wrong loading this conversation."
      onRetry={() => {
        reset();
        router.invalidate();
      }}
    />
  );
}

export const Route = createFileRoute("/_authenticated/inbox/$conversationId")({
  component: ConversationRoute,
  errorComponent: ConversationErrorComponent,
  notFoundComponent: () => (
    <EmptyState
      icon={MessageSquareX}
      title="Conversation not found"
      description="This conversation may have been deleted."
    />
  ),
});

function ConversationRoute() {
  const { conversationId } = Route.useParams();
  const q = useQuery(conversationQueryOptions(conversationId));
  const [panelOpen, setPanelOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (q.data && q.data.unread_count > 0) {
      void markRead(q.data.id);
    }
  }, [q.data]);

  if (q.isLoading) {
    return (
      <div className="flex h-full flex-col gap-3 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  if (!q.data) {
    return (
      <EmptyState
        icon={MessageSquareX}
        title="Conversation not found"
        description="This conversation may have been deleted."
      />
    );
  }

  const conv = q.data;

  return (
    <div className="grid h-full w-full min-w-0 grid-cols-1 lg:grid-cols-[1fr_360px]">
      <ConversationWindow
        conversation={conv}
        onOpenContactPanel={() => setPanelOpen(true)}
        showBack={isMobile}
      />
      <div className="hidden min-h-0 min-w-0 lg:block">
        <ContactPanel contact={conv.contact} />
      </div>
      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-[380px] lg:hidden">
          <ContactPanel contact={conv.contact} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
