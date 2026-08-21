import { createFileRoute, Link } from "@tanstack/react-router";
import { Tags, Filter, Settings2, Bookmark } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";

const links = [
  {
    to: "/tags" as const,
    icon: Tags,
    title: "Tags",
    description: "Colored labels to organize contacts.",
  },
  {
    to: "/segments" as const,
    icon: Filter,
    title: "Segments",
    description: "Dynamic groups defined by rules.",
  },
  {
    to: "/custom-fields" as const,
    icon: Settings2,
    title: "Custom fields",
    description: "Extend contacts and companies with your own fields.",
  },
];

export const Route = createFileRoute("/_authenticated/settings")({
  component: () => (
    <>
      <PageHeader title="Settings" description="Workspace, CRM structure and preferences." />
      <div className="px-4 py-4 sm:px-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          CRM structure
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {links.map((l) => (
            <Link key={l.to} to={l.to}>
              <Card className="flex h-full items-start gap-3 p-4 transition-colors hover:bg-muted/40">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
                  <l.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{l.title}</p>
                  <p className="text-xs text-muted-foreground">{l.description}</p>
                </div>
              </Card>
            </Link>
          ))}
          <Card className="flex h-full items-start gap-3 p-4 opacity-60">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
              <Bookmark className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Saved filters</p>
              <p className="text-xs text-muted-foreground">
                Manage saved filters from the Contacts and Companies pages.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  ),
});
