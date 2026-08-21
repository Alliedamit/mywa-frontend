import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { AppDrawer } from "@/components/common/app-drawer";
import { ColorPicker } from "@/components/common/color-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/lib/notify";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { tagSchema, type TagFormValues } from "../validation";
import { createTag, updateTag } from "../tags.mutations";
import type { TagRow } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: TagRow | null;
}

export function TagDrawer({ open, onOpenChange, tag }: Props) {
  const isEdit = Boolean(tag);
  const { data: workspace } = useCurrentWorkspace();
  const qc = useQueryClient();

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: "", color: "#3b82f6", description: "" },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      tag
        ? { name: tag.name, color: tag.color, description: tag.description ?? "" }
        : { name: "", color: "#3b82f6", description: "" },
    );
  }, [open, tag, form]);

  const mutation = useMutation({
    mutationFn: async (values: TagFormValues) => {
      const parsed = tagSchema.parse(values);
      if (!workspace) throw new Error("No workspace");
      if (isEdit && tag) await updateTag(tag.id, parsed);
      else await createTag(workspace.id, parsed);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      qc.invalidateQueries({ queryKey: ["contact-tags"] });
      notify.success(isEdit ? "Tag updated." : "Tag created.");
      onOpenChange(false);
    },
    onError: (e: unknown) => notify.error(e instanceof Error ? e.message : "Failed to save tag"),
  });

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit tag" : "New tag"}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button form="tag-form" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create tag"}
          </Button>
        </div>
      }
    >
      <form
        id="tag-form"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Name *</Label>
          <Input autoFocus {...form.register("name")} placeholder="Customer" />
          {form.formState.errors.name ? (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Color</Label>
          <Controller
            control={form.control}
            name="color"
            render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
          />
          {form.formState.errors.color ? (
            <p className="text-xs text-destructive">{form.formState.errors.color.message}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Description</Label>
          <Textarea
            rows={3}
            {...form.register("description")}
            placeholder="Optional context for this tag"
          />
        </div>
      </form>
    </AppDrawer>
  );
}
