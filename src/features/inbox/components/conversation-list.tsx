import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Inbox as InboxIcon, SearchX } from "lucide-react";

import { SearchInput } from "@/components/common/search-input";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/hooks/use-auth";
import { conversationsQueryOptions } from "../queries";
import type { InboxFilter } from "../types";
import { ConversationCard } from "./conversation-card";

interface Props {
  filter: InboxFilter;
  search: string;
  activeId?: string;
  onFilterChange: (f: InboxFilter) => void;
  onSearchChange: (s: string) => void;
}

const FILTERS: { key: InboxFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "assigned", label: "Assigned" },
  { key: "pinned", label: "Pinned" },
  { key: "archived", label: "Archived" },
];

export function ConversationList({
  filter,
  search,
  activeId,
  onFilterChange,
  onSearchChange,
}: Props) {
  const { data: workspace } = useCurrentWorkspace();
  const { user } = useAuth();
  const q = useQuery(
    conversationsQueryOptions({
      workspaceId: workspace?.id,
      filter,
      search,
      currentUserId: user?.id ?? null,
    }),
  );

  const items = q.data ?? [];
  const totalUnread = useMemo(
    () => items.reduce((sum, c) => sum + (c.unread_count ?? 0), 0),
    [items],
  );

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 8,
  });

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-border/60 bg-background">
      <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight">Inbox</h1>
            {totalUnread > 0 ? (
              <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px]">
                {totalUnread}
              </Badge>
            ) : null}
          </div>
        </div>
        <SearchInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search conversations…"
        />
        <div className="-mx-1 flex items-center gap-1 overflow-x-auto pb-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onFilterChange(f.key)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === f.key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border/60 text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={parentRef} className="min-h-0 flex-1 overflow-y-auto">
        {q.isLoading ? (
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          search ? (
            <EmptyState
              icon={SearchX}
              title="No matches"
              description="Try a different search term."
              className="min-h-0 py-16"
            />
          ) : (
            <EmptyState
              icon={InboxIcon}
              title="No conversations yet"
              description="Conversations will appear here once messaging is connected."
              className="min-h-0 py-16"
            />
          )
        ) : (
          <div
            style={{ height: rowVirtualizer.getTotalSize(), position: "relative", width: "100%" }}
          >
            {rowVirtualizer.getVirtualItems().map((v) => {
              const c = items[v.index];
              return (
                <div
                  key={c.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${v.start}px)`,
                  }}
                >
                  <ConversationCard conversation={c} active={c.id === activeId} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
