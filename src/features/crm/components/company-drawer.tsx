import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { AppDrawer } from "@/components/common/app-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notify";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { companySchema, type CompanyFormValues } from "../validation";
import { createCompany, updateCompany } from "../mutations";
import type { CompanyRow } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: CompanyRow | null;
  onCreated?: (company: { id: string; company_name: string }) => void;
}

export function CompanyDrawer({ open, onOpenChange, company, onCreated }: Props) {
  const isEdit = Boolean(company);
  const { data: workspace } = useCurrentWorkspace();
  const queryClient = useQueryClient();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      company_name: "",
      phone: "",
      email: "",
      website: "",
      industry: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      company_name: company?.company_name ?? "",
      phone: company?.phone ?? "",
      email: company?.email ?? "",
      website: company?.website ?? "",
      industry: company?.industry ?? "",
    });
  }, [open, company, form]);

  const mutation = useMutation({
    mutationFn: async (values: CompanyFormValues) => {
      const parsed = companySchema.parse(values);
      if (!workspace) throw new Error("No workspace");
      if (isEdit && company) {
        await updateCompany(company.id, parsed);
        return { id: company.id, company_name: parsed.company_name };
      }
      return createCompany({ workspaceId: workspace.id, values: parsed });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company-options"] });
      notify.success(isEdit ? "Company updated." : "Company added successfully.");
      onCreated?.(result);
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to save company";
      notify.error(message);
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit company" : "Add company"}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="company-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Save Company"}
          </Button>
        </div>
      }
    >
      <form id="company-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Company Name" required error={form.formState.errors.company_name?.message}>
          <Input autoFocus {...form.register("company_name")} placeholder="Acme Inc." />
        </Field>
        <Field label="Phone" error={form.formState.errors.phone?.message}>
          <Input {...form.register("phone")} placeholder="+1 415 555 0100" inputMode="tel" />
        </Field>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register("email")} placeholder="hello@acme.com" />
        </Field>
        <Field label="Website" error={form.formState.errors.website?.message}>
          <Input {...form.register("website")} placeholder="https://acme.com" />
        </Field>
        <Field label="Industry" error={form.formState.errors.industry?.message}>
          <Input {...form.register("industry")} placeholder="SaaS" />
        </Field>
      </form>
    </AppDrawer>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
