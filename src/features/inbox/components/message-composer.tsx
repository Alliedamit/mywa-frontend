import { useRef, useState, useEffect } from "react";
import { Paperclip, Smile, FileText, Mic, Send, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TemplatePicker } from "@/features/templates/components/TemplatePicker";
import type { TemplateRow } from "@/features/templates/types";
import { notify } from "@/lib/notify";
import { sendWhatsAppMessage } from "../mutations";
import { isBackendConfigured } from "@/features/whatsapp/config";

const SHORTCUT_TOKEN_RE = /(?:^|\s)(\/[a-z0-9_-]*)$/i;

interface Props {
  workspaceId?: string | null;
  conversationId?: string | null;
}

export function MessageComposer({ workspaceId, conversationId }: Props = {}) {
  const [text, setText] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const qc = useQueryClient();

  const backendReady = isBackendConfigured();
  const canSend = Boolean(workspaceId && conversationId && backendReady);

  const sendMut = useMutation({
    mutationFn: async (payload: { text: string }) => {
      if (!workspaceId || !conversationId) throw new Error("Missing workspace or conversation");
      await sendWhatsAppMessage({
        workspaceId,
        conversationId,
        text: payload.text,
      });
    },
    onSuccess: () => {
      setText("");
      void qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      void qc.invalidateQueries({ queryKey: ["conversations", workspaceId] });
    },
    onError: (e) => notify.error(e instanceof Error ? e.message : "Failed to send"),
  });

  const notReady = () => {
    if (!backendReady) notify.info("WhatsApp backend not configured yet.");
    else if (!workspaceId || !conversationId) notify.info("Open a conversation to send messages.");
    else notify.info("Coming soon.");
  };

  const doSend = () => {
    const t = text.trim();
    if (!t || !canSend || sendMut.isPending) return;
    sendMut.mutate({ text: t });
  };

  // Detect `/token` typed in the textarea and auto-open picker
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const caret = el.selectionStart ?? text.length;
    const before = text.slice(0, caret);
    const m = before.match(SHORTCUT_TOKEN_RE);
    if (m) {
      setPickerSearch(m[1].slice(1));
      setPickerOpen(true);
    } else {
      setPickerOpen((o) => (o && pickerSearch ? false : o));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const insertTemplate = (t: TemplateRow) => {
    const el = ref.current;
    const caret = el?.selectionStart ?? text.length;
    const before = text.slice(0, caret);
    const after = text.slice(caret);
    const m = before.match(SHORTCUT_TOKEN_RE);
    const trimmedBefore = m ? before.slice(0, before.length - m[1].length) : before;
    const next = trimmedBefore + t.content + after;
    setText(next);
    setPickerOpen(false);
    setPickerSearch("");
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = (trimmedBefore + t.content).length;
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="border-t border-border/60 bg-background px-3 py-2.5">
        <div className="flex items-end gap-2">
          <div className="flex items-center gap-0.5">
            <IconBtn label="Emoji" onClick={notReady}>
              <Smile className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Attach file" onClick={notReady}>
              <Paperclip className="h-4 w-4" />
            </IconBtn>

            <Popover
              open={pickerOpen}
              onOpenChange={(o) => {
                setPickerOpen(o);
                if (!o) setPickerSearch("");
              }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground"
                      aria-label="Templates"
                      onClick={() => {
                        setPickerSearch("");
                        setPickerOpen((o) => !o);
                      }}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">Templates — type "/" to search</TooltipContent>
              </Tooltip>
              <PopoverContent
                side="top"
                align="start"
                className="w-[360px] p-0"
                onOpenAutoFocus={(e) => {
                  // When opened via typing "/", keep focus in the textarea.
                  if (pickerSearch) e.preventDefault();
                }}
              >
                <TemplatePicker
                  key={pickerSearch}
                  initialSearch={pickerSearch}
                  autoFocus={!pickerSearch}
                  onSelect={insertTemplate}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message… (press / for templates)"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Escape" && pickerOpen) {
                e.preventDefault();
                setPickerOpen(false);
                setPickerSearch("");
                return;
              }
              if (e.key === "Enter" && !e.shiftKey) {
                if (pickerOpen) return; // let picker handle Enter
                e.preventDefault();
                if (canSend) doSend();
                else notReady();
              }
            }}
            className="min-h-[40px] max-h-40 flex-1 resize-none rounded-2xl border border-border/60 px-3 py-2 text-sm"
          />
          <IconBtn label="Voice note" onClick={notReady}>
            <Mic className="h-4 w-4" />
          </IconBtn>
          <Button
            size="icon"
            onClick={() => (canSend ? doSend() : notReady())}
            disabled={!text.trim() || sendMut.isPending}
            aria-label="Send"
            className="h-9 w-9 shrink-0 rounded-full"
          >
            {sendMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground"
          onClick={onClick}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
