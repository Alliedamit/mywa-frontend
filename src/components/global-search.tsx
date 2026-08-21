import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="hidden h-9 w-full max-w-sm justify-start gap-2 rounded-lg px-3 text-sm font-normal text-muted-foreground sm:flex"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
        <span>Search…</span>
        <kbd className="ml-auto hidden select-none items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:inline-flex">
          ⌘K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <Search className="h-[1.1rem] w-[1.1rem]" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search anything…" />
        <CommandList>
          <CommandEmpty>Search is coming soon.</CommandEmpty>
        </CommandList>
      </CommandDialog>
    </>
  );
}
