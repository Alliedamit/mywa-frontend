import { useState } from "react";
import { Bookmark, MoreHorizontal, Save, Trash2, Pencil, Check } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { notify } from "@/lib/notify";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { savedFiltersQueryOptions } from "@/features/crm/saved-filters.queries";
import {
  createSavedFilter,
  deleteSavedFilter,
  renameSavedFilter,
} from "@/features/crm/saved-filters.mutations";
import { useAuth } from "@/hooks/use-auth";
import type { SavedFilterModule, SavedFilterRow } from "@/features/crm/types";

interface Props {
  module: SavedFilterModule;
  currentFilters: Record<string, unknown>;
  activeId?: string;
  onApply: (filter: SavedFilterRow) => void;
  onClear: () => void;
}

export function SavedFiltersMenu({ module, currentFilters, activeId, onApply, onClear }: Props) {
  const { data: workspace } = useCurrentWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const filtersQ = useQuery({
    ...savedFiltersQueryOptions(workspace?.id ?? "", module),
    enabled: Boolean(workspace?.id),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["saved-filters", workspace?.id, module] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!workspace) throw new Error("No workspace");
      if (!name.trim()) throw new Error("Name required");
      await createSavedFilter({
        workspaceId: workspace.id,
        module,
        name: name.trim(),
        filters: currentFilters,
        createdBy: user?.id ?? null,
      });
    },
    onSuccess: () => {
      notify.success("Filter saved.");
      setName("");
      setSaveOpen(false);
      invalidate();
    },
    onError: (e: unknown) => notify.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const renameMutation = useMutation({
    mutationFn: async () => {
      if (!renameId || !renameValue.trim()) return;
      await renameSavedFilter(renameId, renameValue.trim());
    },
    onSuccess: () => {
      setRenameId(null);
      setRenameValue("");
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSavedFilter(id),
    onSuccess: () => {
      notify.success("Filter deleted.");
      invalidate();
    },
  });

  const filters = filtersQ.data ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <Bookmark className="mr-1.5 h-4 w-4" />
          {activeId ? (filters.find((f) => f.id === activeId)?.name ?? "Filter") : "Saved"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs">Saved filters</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {filters.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">No saved filters yet.</div>
        ) : (
          filters.map((f) => (
            <div key={f.id} className="flex items-center gap-1 px-1">
              {renameId === f.id ? (
                <div className="flex flex-1 items-center gap-1 py-1">
                  <Input
                    autoFocus
                    className="h-7 text-xs"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") renameMutation.mutate();
                      if (e.key === "Escape") setRenameId(null);
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => renameMutation.mutate()}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <DropdownMenuItem className="flex-1" onClick={() => onApply(f)}>
                    {activeId === f.id ? (
                      <Check className="mr-2 h-3.5 w-3.5" />
                    ) : (
                      <Bookmark className="mr-2 h-3.5 w-3.5 opacity-60" />
                    )}
                    <span className="truncate">{f.name}</span>
                  </DropdownMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setRenameId(f.id);
                          setRenameValue(f.name);
                        }}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteMutation.mutate(f.id)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          ))
        )}
        <DropdownMenuSeparator />
        {activeId ? (
          <DropdownMenuItem onClick={onClear}>Clear active filter</DropdownMenuItem>
        ) : null}
        <Popover open={saveOpen} onOpenChange={setSaveOpen}>
          <PopoverTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Save className="mr-2 h-3.5 w-3.5" /> Save current filter…
            </DropdownMenuItem>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">Filter name</label>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My customers"
                className="h-8"
              />
              <Button
                size="sm"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                Save
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
