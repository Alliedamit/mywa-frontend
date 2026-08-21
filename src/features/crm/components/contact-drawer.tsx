import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppDrawer } from "@/components/common/app-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/hooks/use-auth";
import { contactSchema, type ContactFormValues } from "../validation";
import { createContact, updateContact, DuplicateWhatsappError } from "../mutations";
import { companyOptionsQuery } from "../queries";
import type { ContactWithRelations } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: ContactWithRelations | null;
}

export function ContactDrawer({ open, onOpenChange, contact }: Props) {
  const isEdit = Boolean(contact);
  const { data: workspace } = useCurrentWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [moreOpen, setMoreOpen] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: "",
      whatsapp_number: "",
      last_name: "",
      display_name: "",
      email: "",
      company_id: "",
      designation: "",
      owner_user_id: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (contact) {
      form.reset({
        first_name: contact.first_name,
        whatsapp_number: contact.whatsapp_number,
        last_name: contact.last_name ?? "",
        display_name: contact.display_name ?? "",
        email: contact.email ?? "",
        company_id: contact.company_id ?? "",
        designation: contact.designation ?? "",
        owner_user_id: contact.owner_user_id ?? "",
      });
      setMoreOpen(true);
    } else {
      form.reset({
        first_name: "",
        whatsapp_number: "",
        last_name: "",
        display_name: "",
        email: "",
        company_id: "",
        designation: "",
        owner_user_id: user?.id ?? "",
      });
      setMoreOpen(false);
    }
  }, [open, contact, user?.id, form]);

  const companiesQ = useQuery({
    ...companyOptionsQuery(workspace?.id ?? "", ""),
    enabled: Boolean(workspace?.id) && open,
  });

  const mutation = useMutation({
    mutationFn: async (values: ContactFormValues) => {
      const parsed = contactSchema.parse(values);
      if (!workspace) throw new Error("No workspace");
      if (isEdit && contact) {
        await updateContact({ id: contact.id, values: parsed });
      } else {
        await createContact({
          workspaceId: workspace.id,
          ownerUserId: user?.id ?? "",
          values: parsed,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      if (contact) queryClient.invalidateQueries({ queryKey: ["contact", contact.id] });
      notify.success(isEdit ? "Contact updated." : "Contact Added Successfully.");
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      if (error instanceof DuplicateWhatsappError) {
        form.setError("whatsapp_number", { message: error.message });
        notify.error(error.message);
        return;
      }
      const message = error instanceof Error ? error.message : "Failed to save contact";
      notify.error(message);
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit contact" : "Add contact"}
      description={isEdit ? undefined : "Only the essentials — add more later."}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="contact-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Save Contact"}
          </Button>
        </div>
      }
    >
      <form id="contact-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="First Name" required error={form.formState.errors.first_name?.message}>
          <Input autoFocus {...form.register("first_name")} placeholder="Jane" />
        </Field>

        <Field
          label="WhatsApp Number"
          required
          error={form.formState.errors.whatsapp_number?.message}
        >
          <Input
            {...form.register("whatsapp_number")}
            placeholder="+1 415 555 0100"
            inputMode="tel"
            autoComplete="off"
          />
        </Field>

        <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md border border-dashed border-border/70 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40"
            >
              More Details
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", moreOpen && "rotate-180")}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 flex flex-col gap-4">
            <Field label="Last Name" error={form.formState.errors.last_name?.message}>
              <Input {...form.register("last_name")} placeholder="Doe" />
            </Field>
            <Field label="Display Name" error={form.formState.errors.display_name?.message}>
              <Input {...form.register("display_name")} placeholder="Optional" />
            </Field>
            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register("email")} placeholder="jane@example.com" />
            </Field>
            <Field label="Company">
              <Controller
                control={form.control}
                name="company_id"
                render={({ field }) => (
                  <Select
                    value={field.value || "__none__"}
                    onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No company</SelectItem>
                      {(companiesQ.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Designation" error={form.formState.errors.designation?.message}>
              <Input {...form.register("designation")} placeholder="Head of Growth" />
            </Field>
            <Field label="Owner">
              <Controller
                control={form.control}
                name="owner_user_id"
                render={({ field }) => (
                  <Select
                    value={field.value || "__me__"}
                    onValueChange={(v) => field.onChange(v === "__me__" ? (user?.id ?? "") : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={user?.id ?? "__me__"}>Me ({user?.email})</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </CollapsibleContent>
        </Collapsible>
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
