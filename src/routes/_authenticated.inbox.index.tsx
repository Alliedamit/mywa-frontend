import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";

export const Route = createFileRoute("/_authenticated/inbox/")({
  component: () => (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={MessageSquare}
        title="Select a conversation"
        description="Pick a conversation from the list to start reading messages."
      />
    </div>
  ),
});
