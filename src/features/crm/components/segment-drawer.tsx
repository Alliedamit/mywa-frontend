import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { AppDrawer } from "@/components/common/app-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/lib/notify";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { segmentSchema, type SegmentFormValues } from "../validation";
import type { SegmentGroup, SegmentRow } from "../types";
import { createSegment, updateSegment } from "../segments.mutations";
import { RuleBuilder } from "./rule-builder";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment?: SegmentRow | null;
}

const emptyGroup: SegmentGroup = { combinator: "and", rules: [] };

export function SegmentDrawer({ open, onOpenChange, segment }: Props) {
  const isEdit = Boolean(segment);
  const { data: workspace } = useCurrentWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rules, setRules] = useState<SegmentGroup>(emptyGroup);

  const form = useForm<SegmentFormValues>({
    resolver: zodResolver(segmentSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (!open) return;
    if (segment) {
      form.reset({ name: segment.name, description: segment.description ?? "" });
      setRules(segment.rules ?? emptyGroup);
    } else {
      form.reset({ name: "", description: "" });
      setRules(emptyGroup);
    }
  }, [open, segment, form]);

  const mutation = useMutation({
    mutationFn: async (values: SegmentFormValues) => {
      const parsed = segmentSchema.parse(values);
      if (!workspace) throw new Error("No workspace");
      if (isEdit && segment) await updateSegment(segment.id, parsed, rules);
      else await createSegment(workspace.id, parsed, rules, user?.id ?? null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["segments"] });
      notify.success(isEdit ? "Segment updated." : "Segment created.");
      onOpenChange(false);
    },
    onError: (e: unknown) => notify.error(e instanceof Error ? e.message : "Failed to save"),
  });

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit segment" : "New segment"}
      description="Define rules that automatically match contacts."
      widthClassName="sm:max-w-[600px]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button form="segment-form" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create segment"}
          </Button>
        </div>
      }
    >
      <form
        id="segment-form"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Name *</Label>
          <Input autoFocus {...form.register("name")} placeholder="Hot leads this month" />
          {form.formState.errors.name ? (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Description</Label>
          <Textarea rows={2} {...form.register("description")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Rules</Label>
          <RuleBuilder value={rules} onChange={setRules} />
          <p className="text-[11px] text-muted-foreground">
            Contact count activates once the rule engine ships in a later release.
          </p>
        </div>
      </form>
    </AppDrawer>
  );
}
