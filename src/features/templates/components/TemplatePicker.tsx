import { useMemo } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { templatesQueryOptions } from "../queries";
import type { TemplateRow } from "../types";
import { Star } from "lucide-react";

interface Props {
  onSelect: (t: TemplateRow) => void;
  initialSearch?: string;
  autoFocus?: boolean;
}

export function TemplatePicker({ onSelect, initialSearch = "", autoFocus = true }: Props) {
  const { data: workspace } = useCurrentWorkspace();
  const q = useQuery({
    ...templatesQueryOptions({ workspaceId: workspace?.id ?? "" }),
    enabled: Boolean(workspace?.id),
  });

  const grouped = useMemo(() => {
    const byCat = new Map<string, TemplateRow[]>();
    for (const t of q.data ?? []) {
      const arr = byCat.get(t.category) ?? [];
      arr.push(t);
      byCat.set(t.category, arr);
    }
    return Array.from(byCat.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [q.data]);

  return (
    <Command
      shouldFilter
      className="max-h-[420px]"
      // preload search when opened via `/shortcut`
      defaultValue={initialSearch}
    >
      <CommandInput
        autoFocus={autoFocus}
        placeholder="Search templates by name, shortcut, or text…"
        defaultValue={initialSearch}
      />
      <CommandList>
        <CommandEmpty>{q.isLoading ? "Loading…" : "No templates found."}</CommandEmpty>
        {grouped.map(([cat, items]) => (
          <CommandGroup key={cat} heading={cat}>
            {items.map((t) => (
              <CommandItem
                key={t.id}
                value={`${t.name} ${t.shortcut ?? ""} ${t.content}`}
                onSelect={() => onSelect(t)}
                className="flex flex-col items-start gap-1 py-2"
              >
                <div className="flex w-full items-center gap-2">
                  {t.is_favorite ? (
                    <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                  ) : null}
                  <span className="truncate text-sm font-medium">{t.name}</span>
                  {t.shortcut ? (
                    <Badge variant="secondary" className="ml-auto font-mono text-[10px]">
                      /{t.shortcut}
                    </Badge>
                  ) : null}
                </div>
                <span className="line-clamp-2 text-xs text-muted-foreground">{t.content}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}
