import { Bell } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { GlobalSearch } from "./global-search";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

interface TopHeaderProps {
  user: User;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export function TopHeader({ user, displayName, avatarUrl }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-5" />
      <div className="flex flex-1 items-center justify-end gap-1 sm:justify-between">
        <div className="hidden flex-1 sm:block">
          <GlobalSearch />
        </div>
        <div className="flex items-center gap-1">
          <div className="sm:hidden">
            <GlobalSearch />
          </div>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-[1.1rem] w-[1.1rem]" />
          </Button>
          <ThemeToggle />
          <UserMenu user={user} displayName={displayName} avatarUrl={avatarUrl} />
        </div>
      </div>
    </header>
  );
}
