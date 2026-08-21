import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, StarOff, Variable, Check, Plus } from "lucide-react";

import { AppDrawer } from "@/components/common/app-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/hooks/use-auth";

import { templateSchema, type TemplateFormValues } from "../validation";
import { createTemplate, updateTemplate, DuplicateShortcutError } from "../mutations";
import { templateCategoriesQueryOptions } from "../queries";
import { SUGGESTED_VARIABLES } from "../constants";
import { stripLeadingSlash } from "../utils";
import type { TemplateRow } from "../types";
import { TemplatePreview } from "./TemplatePreview";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: TemplateRow | null;
}

export function TemplateDrawer({ open, onOpenChange, template }: Props) {
  const isEdit = Boolean(template);
  const { data: workspace } = useCurrentWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();
  const categoriesQ = useQuery(templateCategoriesQueryOptions(workspace?.id));
  const [catPopoverOpen, setCatPopoverOpen] = useState(false);
  const [varPopoverOpen, setVarPopoverOpen] = useState(false);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      category: "General",
      shortcut: "",
      content: "",
      is_favorite: false,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      template
        ? {
            name: template.name,
            category: template.category,
            shortcut: template.shortcut ?? "",
            content: template.content,
            is_favorite: template.is_favorite,
          }
        : {
            name: "",
            category: "General",
            shortcut: "",
            content: "",
            is_favorite: false,
          },
    );
  }, [open, template, form]);

  const contentValue = form.watch("content");
  const categoryValue = form.watch("category");
  const favValue = form.watch("is_favorite");

  const categories = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data]);

  const mutation = useMutation({
    mutationFn: async (values: TemplateFormValues) => {
      const parsed = templateSchema.parse(values);
      if (!workspace || !user) throw new Error("No workspace");
      if (isEdit && template) await updateTemplate(template.id, parsed);
      else await createTemplate({ workspaceId: workspace.id, userId: user.id, values: parsed });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      qc.invalidateQueries({ queryKey: ["template-categories"] });
      notify.success(isEdit ? "Template updated." : "Template created.");
      onOpenChange(false);
    },
    onError: (e: unknown) => {
      if (e instanceof DuplicateShortcutError) {
        form.setError("shortcut", { message: e.message });
        return;
      }
      notify.error(e instanceof Error ? e.message : "Failed to save template");
    },
  });

  const insertVariable = (name: string) => {
    const current = form.getValues("content") ?? "";
    const token = `{{${name}}}`;
    const el = document.getElementById("template-content") as HTMLTextAreaElement | null;
    if (el) {
      const start = el.selectionStart ?? current.length;
      const end = el.selectionEnd ?? current.length;
      const next = current.slice(0, start) + token + current.slice(end);
      form.setValue("content", next, { shouldDirty: true });
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + token.length;
        el.setSelectionRange(pos, pos);
      });
    } else {
      form.setValue("content", current + token, { shouldDirty: true });
    }
    setVarPopoverOpen(false);
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit template" : "New template"}
      description="Reusable message with optional variables."
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => form.setValue("is_favorite", !favValue, { shouldDirty: true })}
            className="gap-1.5"
          >
            {favValue ? (
              <>
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Favorited
              </>
            ) : (
              <>
                <StarOff className="h-4 w-4" /> Favorite
              </>
            )}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button form="template-form" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create template"}
            </Button>
          </div>
        </div>
      }
    >
      <form
        id="template-form"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Template name *</Label>
          <Input autoFocus {...form.register("name")} placeholder="Thanks for reaching out" />
          {form.formState.errors.name ? (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Category</Label>
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Popover open={catPopoverOpen} onOpenChange={setCatPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="justify-between font-normal"
                    >
                      {field.value || "Select category"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search or create…" />
                      <CommandList>
                        <CommandEmpty>
                          <CommandCreate
                            onCreate={(v) => {
                              field.onChange(v);
                              setCatPopoverOpen(false);
                            }}
                          />
                        </CommandEmpty>
                        <CommandGroup>
                          {categories.map((c) => (
                            <CommandItem
                              key={c}
                              value={c}
                              onSelect={() => {
                                field.onChange(c);
                                setCatPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === c ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {c}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            />
            {form.formState.errors.category ? (
              <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Shortcut</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                /
              </span>
              <Controller
                control={form.control}
                name="shortcut"
                render={({ field }) => (
                  <Input
                    value={stripLeadingSlash(field.value ?? "")}
                    onChange={(e) =>
                      field.onChange(stripLeadingSlash(e.target.value.toLowerCase()))
                    }
                    placeholder="thanks"
                    className="pl-6 font-mono"
                    maxLength={32}
                  />
                )}
              />
            </div>
            {form.formState.errors.shortcut ? (
              <p className="text-xs text-destructive">{form.formState.errors.shortcut.message}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Type{" "}
                <span className="font-mono">
                  /{stripLeadingSlash(form.watch("shortcut") ?? "") || "shortcut"}
                </span>{" "}
                in the composer to insert.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">Message *</Label>
            <Popover open={varPopoverOpen} onOpenChange={setVarPopoverOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
                  <Variable className="h-3.5 w-3.5" /> Insert variable
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0" align="end">
                <Command>
                  <CommandInput placeholder="Variable name…" />
                  <CommandList>
                    <CommandEmpty>
                      <CommandCreate
                        placeholder="custom_field"
                        label="Insert"
                        onCreate={(v) => insertVariable(v)}
                      />
                    </CommandEmpty>
                    <CommandGroup heading="Common">
                      {SUGGESTED_VARIABLES.map((v) => (
                        <CommandItem key={v} value={v} onSelect={() => insertVariable(v)}>
                          <Variable className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono text-xs">{`{{${v}}}`}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <Textarea
            id="template-content"
            rows={7}
            {...form.register("content")}
            placeholder="Hi {{name}}, thanks for getting in touch…"
            className="font-normal"
          />
          {form.formState.errors.content ? (
            <p className="text-xs text-destructive">{form.formState.errors.content.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">Live preview</Label>
          <TemplatePreview content={contentValue ?? ""} />
        </div>

        <input type="hidden" value={categoryValue} readOnly />
      </form>
    </AppDrawer>
  );
}

function CommandCreate({
  onCreate,
  placeholder = "New value",
  label = "Create",
}: {
  onCreate: (v: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const [v, setV] = useState("");
  return (
    <div className="flex items-center gap-2 p-2">
      <Input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={!v.trim()}
        onClick={() => onCreate(v.trim())}
        className="h-8 gap-1"
      >
        <Plus className="h-3.5 w-3.5" /> {label}
      </Button>
    </div>
  );
}
