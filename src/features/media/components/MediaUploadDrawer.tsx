import { useEffect, useRef, useState } from "react";
import { UploadCloud, X, AlertTriangle } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { notify } from "@/lib/notify";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/hooks/use-auth";
import type { MediaRow } from "../types";
import {
  ACCEPT_ATTR,
  MAX_FILE_SIZE,
  MEDIA_CATEGORIES,
  detectFileType,
  formatBytes,
} from "../constants";
import { findDuplicate, uploadMedia } from "../mutations";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialFiles?: File[];
  onUploaded?: (rows: MediaRow[]) => void;
}

type Pending = {
  file: File;
  name: string;
  category: string;
  description: string;
  favorite: boolean;
  duplicate: MediaRow | null;
  action: "auto" | "replace" | "keep-both" | "cancel";
  status: "idle" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
};

export function MediaUploadDrawer({ open, onOpenChange, initialFiles, onUploaded }: Props) {
  const { data: workspace } = useCurrentWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Pending[]>([]);

  useEffect(() => {
    if (open && initialFiles && initialFiles.length) {
      addFiles(initialFiles);
    }
    if (!open) setItems([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function addFiles(files: File[]) {
    if (!workspace) return;
    const next: Pending[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        notify.error(`${file.name} exceeds 25MB limit`);
        continue;
      }
      if (!detectFileType(file.type, file.name)) {
        notify.error(`${file.name} — unsupported file type`);
        continue;
      }
      const dup = await findDuplicate(workspace.id, file.name, file.size).catch(() => null);
      next.push({
        file,
        name: file.name.replace(/\.[^.]+$/, ""),
        category: "General",
        description: "",
        favorite: false,
        duplicate: dup,
        action: dup ? "auto" : "auto",
        status: "idle",
        progress: 0,
      });
    }
    setItems((prev) => [...prev, ...next]);
  }

  function updateItem(idx: number, patch: Partial<Pending>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!workspace || !user) throw new Error("No workspace");
      const uploaded: MediaRow[] = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.status === "done") continue;
        if (it.duplicate && it.action === "cancel") continue;
        updateItem(i, { status: "uploading", progress: 20 });
        try {
          const row = await uploadMedia({
            workspaceId: workspace.id,
            userId: user.id,
            file: it.file,
            meta: {
              name: it.name || it.file.name,
              category: it.category || null,
              description: it.description || null,
              is_favorite: it.favorite,
            },
            replaceOf: it.duplicate && it.action === "replace" ? it.duplicate : null,
            onProgress: (p) => updateItem(i, { progress: p }),
          });
          uploaded.push(row);
          updateItem(i, { status: "done", progress: 100 });
        } catch (e) {
          updateItem(i, {
            status: "error",
            error: e instanceof Error ? e.message : "Upload failed",
          });
        }
      }
      return uploaded;
    },
    onSuccess: (rows) => {
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["media-recent-used"] });
      if (rows.length) {
        notify.success(`Uploaded ${rows.length} file${rows.length === 1 ? "" : "s"}.`);
        onUploaded?.(rows);
        onOpenChange(false);
      }
    },
    onError: (e) => notify.error(e instanceof Error ? e.message : "Failed to upload files"),
  });

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Upload media"
      description="Images, PDFs and documents up to 25MB."
      widthClassName="sm:max-w-[520px]"
      footer={
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {items.length} file{items.length === 1 ? "" : "s"} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!items.length || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length) addFiles(Array.from(e.dataTransfer.files));
          }}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-muted/30 py-8 text-center transition-colors hover:border-primary/60 hover:bg-muted/50"
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Click or drop files</p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WEBP, PDF, DOC, XLS, PPT, TXT · Max 25 MB
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT_ATTR}
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(Array.from(e.target.files));
              if (inputRef.current) inputRef.current.value = "";
            }}
          />
        </button>

        {items.map((it, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg border border-border/60 p-3">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{it.file.name}</p>
                <p className="text-[11px] text-muted-foreground">{formatBytes(it.file.size)}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => removeItem(i)}
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {it.duplicate ? (
              <div className="flex flex-col gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />A file with the same name and size
                  already exists.
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant={it.action === "replace" ? "default" : "outline"}
                    className="h-7"
                    onClick={() => updateItem(i, { action: "replace" })}
                  >
                    Replace
                  </Button>
                  <Button
                    size="sm"
                    variant={it.action === "keep-both" ? "default" : "outline"}
                    className="h-7"
                    onClick={() => updateItem(i, { action: "keep-both" })}
                  >
                    Keep both
                  </Button>
                  <Button
                    size="sm"
                    variant={it.action === "cancel" ? "default" : "outline"}
                    className="h-7"
                    onClick={() => updateItem(i, { action: "cancel" })}
                  >
                    Skip
                  </Button>
                </div>
              </div>
            ) : null}

            {(!it.duplicate || it.action !== "cancel") && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 flex flex-col gap-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Display name
                    </Label>
                    <Input
                      value={it.name}
                      onChange={(e) => updateItem(i, { name: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Category
                    </Label>
                    <Select
                      value={it.category}
                      onValueChange={(v) => updateItem(i, { category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDIA_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-center gap-2 pt-6 text-xs">
                    <Checkbox
                      checked={it.favorite}
                      onCheckedChange={(v) => updateItem(i, { favorite: Boolean(v) })}
                    />
                    Add to favorites
                  </label>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    Description
                  </Label>
                  <Textarea
                    rows={2}
                    value={it.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </>
            )}

            {it.status === "uploading" ? <Progress value={it.progress} className="h-1.5" /> : null}
            {it.status === "error" ? <p className="text-xs text-destructive">{it.error}</p> : null}
          </div>
        ))}
      </div>
    </AppDrawer>
  );
}
