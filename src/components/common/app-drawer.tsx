import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AppDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
  widthClassName?: string;
}

export function AppDrawer({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  widthClassName,
}: AppDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn("flex w-full flex-col gap-0 p-0 sm:max-w-[440px]", widthClassName)}
      >
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="text-base font-semibold tracking-tight">{title}</SheetTitle>
          {description ? (
            <SheetDescription className="text-xs text-muted-foreground">
              {description}
            </SheetDescription>
          ) : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="border-t border-border/60 bg-background/80 px-5 py-3 backdrop-blur">
            {footer}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
