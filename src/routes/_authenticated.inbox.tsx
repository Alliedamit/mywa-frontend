import { Outlet, createFileRoute, useMatch } from "@tanstack/react-router";
import { useCallback } from "react";
import { z } from "zod";

import { ConversationList } from "@/features/inbox/components/conversation-list";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { useInboxRealtime } from "@/features/inbox/use-inbox-realtime";
import type { InboxFilter } from "@/features/inbox/types";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  filter: z.string().optional().catch("all"),
  q: z.string().optional().catch(""),
});

type InboxSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/_authenticated/inbox")({
  validateSearch: (search) => searchSchema.parse(search),
  component: InboxLayout,
});

const VALID: InboxFilter[] = ["all", "unread", "assigned", "archived", "pinned"];

function InboxLayout() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: workspace } = useCurrentWorkspace();
  useInboxRealtime(workspace?.id);

  const filter: InboxFilter = (VALID as string[]).includes(search.filter)
    ? (search.filter as InboxFilter)
    : "all";

  const detailMatch = useMatch({
    from: "/_authenticated/inbox/$conversationId",
    shouldThrow: false,
  });
  const activeId = detailMatch?.params.conversationId;

  const setFilter = useCallback(
    (f: InboxFilter) => {
      navigate({ search: (p: InboxSearch) => ({ ...p, filter: f }) });
    },
    [navigate],
  );
  const setSearch = useCallback(
    (q: string) => {
      navigate({ search: (p: InboxSearch) => ({ ...p, q }), replace: true });
    },
    [navigate],
  );

  return (
    <div className="grid h-[calc(100vh-3.5rem)] w-full min-w-0 grid-cols-1 md:grid-cols-[340px_1fr]">
      <aside
        className={cn("min-h-0 min-w-0", activeId ? "hidden md:flex md:flex-col" : "flex flex-col")}
      >
        <ConversationList
          filter={filter}
          search={search.q}
          activeId={activeId}
          onFilterChange={setFilter}
          onSearchChange={setSearch}
        />
      </aside>
      <section
        className={cn("min-h-0 min-w-0", activeId ? "flex flex-col" : "hidden md:flex md:flex-col")}
      >
        <Outlet />
      </section>
    </div>
  );
}
