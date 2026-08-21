import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { AppDrawer } from "@/components/common/app-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notify } from "@/lib/notify";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { customFieldSchema, type CustomFieldFormValues } from "../validation";
import type { CustomFieldModule, CustomFieldRow, CustomFieldType } from "../types";
import { createCustomField, updateCustomField } from "../custom-fields.mutations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: CustomFieldModule;
  field?: CustomFieldRow | null;
}

const TYPES: { value: CustomFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "date", label: "Date" },
  { value: "checkbox", label: "Checkbox" },
  { value: "dropdown", label: "Dropdown" },
  { value: "currency", label: "Currency" },
];

export function CustomFieldDrawer({ open, onOpenChange, module, field }: Props) {
  const isEdit = Boolean(field);
  const { data: workspace } = useCurrentWorkspace();
  const qc = useQueryClient();

  const form = useForm<CustomFieldFormValues>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: { name: "", module, type: "text", choices: "", currency: "USD" },
  });

  useEffect(() => {
    if (!open) return;
    if (field) {
      form.reset({
        name: field.name,
        module: field.module,
        type: field.type,
        choices: (field.options.choices ?? []).join("\n"),
        currency: field.options.currency ?? "USD",
      });
    } else {
      form.reset({ name: "", module, type: "text", choices: "", currency: "USD" });
    }
  }, [open, field, module, form]);

  const type = form.watch("type");

  const mutation = useMutation({
    mutationFn: async (values: CustomFieldFormValues) => {
      const parsed = customFieldSchema.parse(values);
      if (!workspace) throw new Error("No workspace");
      if (isEdit && field) await updateCustomField(field.id, parsed);
      else await createCustomField(workspace.id, parsed);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-fields"] });
      notify.success(isEdit ? "Field updated." : "Field created.");
      onOpenChange(false);
    },
    onError: (e: unknown) => notify.error(e instanceof Error ? e.message : "Failed to save"),
  });

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit custom field" : "New custom field"}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button form="cf-form" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create field"}
          </Button>
        </div>
      }
    >
      <form
        id="cf-form"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Name *</Label>
          <Input autoFocus {...form.register("name")} placeholder="Lead Source" />
          {form.formState.errors.name ? (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Type *</Label>
          <Select value={type} onValueChange={(v) => form.setValue("type", v as CustomFieldType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {type === "dropdown" ? (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Choices</Label>
            <Textarea
              rows={5}
              {...form.register("choices")}
              placeholder={"Option 1\nOption 2\nOption 3"}
            />
            <p className="text-[11px] text-muted-foreground">One choice per line.</p>
          </div>
        ) : null}
        {type === "currency" ? (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Currency code</Label>
            <Input {...form.register("currency")} placeholder="USD" />
          </div>
        ) : null}
      </form>
    </AppDrawer>
  );
}
