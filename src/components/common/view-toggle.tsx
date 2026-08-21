import { LayoutGrid, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ViewMode = "table" | "cards";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-background p-0.5",
        className,
      )}
      role="group"
      aria-label="View mode"
    >
      <Button
        type="button"
        size="icon"
        variant={value === "table" ? "secondary" : "ghost"}
        className="h-7 w-7"
        aria-pressed={value === "table"}
        aria-label="Table view"
        onClick={() => onChange("table")}
      >
        <Rows3 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={value === "cards" ? "secondary" : "ghost"}
        className="h-7 w-7"
        aria-pressed={value === "cards"}
        aria-label="Cards view"
        onClick={() => onChange("cards")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}
