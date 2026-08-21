import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Contact, Inbox as InboxIcon, MessageSquare, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const stats = [
  { label: "Open conversations", value: "0", icon: MessageSquare },
  { label: "New contacts (7d)", value: "0", icon: Contact },
  { label: "Unread in inbox", value: "0", icon: InboxIcon },
  { label: "Automations running", value: "0", icon: Sparkles },
];

function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A quick look at what's happening in your workspace."
        actions={
          <Button size="sm" variant="outline">
            View reports <ArrowUpRight className="ml-1.5 h-4 w-4" />
          </Button>
        }
      />
      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">{s.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">No data yet</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="px-4 pb-8 sm:px-6">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold">Your workspace is ready</h3>
            <p className="max-w-md text-xs text-muted-foreground">
              Connect a WhatsApp number and import contacts to start seeing activity here.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
