import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  count: number;
  onClear: () => void;
  children: ReactNode;
}

export function BulkActionBar({ count, onClear, children }: Props) {
  if (count === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-full border border-border/70 bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
        <span className="pl-2 text-xs font-medium text-muted-foreground">{count} selected</span>
        <div className="mx-1 h-4 w-px bg-border" />
        <div className="flex flex-wrap items-center gap-1">{children}</div>
        <div className="mx-1 h-4 w-px bg-border" />
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-full"
          onClick={onClear}
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
