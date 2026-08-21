import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Tag as TagIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { tagsQueryOptions } from "../tags.queries";
import { assignTagsToContacts } from "../tags.mutations";

interface Props {
  contactIds: string[];
  onDone?: () => void;
  triggerLabel?: string;
}

export function AssignTagsPopover({ contactIds, onDone, triggerLabel = "Assign tags" }: Props) {
  const { data: workspace } = useCurrentWorkspace();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const tagsQ = useQuery({
    ...tagsQueryOptions(workspace?.id ?? ""),
    enabled: Boolean(workspace?.id) && open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await assignTagsToContacts(contactIds, Array.from(selected));
    },
    onSuccess: () => {
      notify.success("Tags assigned.");
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contact-tags"] });
      setSelected(new Set());
      setOpen(false);
      onDone?.();
    },
    onError: (e: unknown) => notify.error(e instanceof Error ? e.message : "Failed to assign"),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost">
          <TagIcon className="mr-1.5 h-4 w-4" />
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Search tags…" />
          <CommandList>
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup>
              {(tagsQ.data ?? []).map((t) => {
                const isSel = selected.has(t.id);
                return (
                  <CommandItem
                    key={t.id}
                    value={t.name}
                    onSelect={() => {
                      const next = new Set(selected);
                      if (isSel) next.delete(t.id);
                      else next.add(t.id);
                      setSelected(next);
                    }}
                  >
                    <span
                      className="mr-2 h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="flex-1 truncate">{t.name}</span>
                    <Check className={cn("h-4 w-4", isSel ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="flex items-center justify-between gap-2 border-t border-border/60 p-2">
          <span className="text-xs text-muted-foreground">
            {selected.size} tag{selected.size === 1 ? "" : "s"}
          </span>
          <Button
            size="sm"
            disabled={selected.size === 0 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
