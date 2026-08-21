import { previewSegments } from "../utils";
import { cn } from "@/lib/utils";

export function TemplatePreview({ content, className }: { content: string; className?: string }) {
  const segs = previewSegments(content);
  if (!content.trim()) {
    return (
      <p className={cn("text-xs italic text-muted-foreground", className)}>
        Preview will appear here as you type…
      </p>
    );
  }
  return (
    <div
      className={cn(
        "whitespace-pre-wrap break-words rounded-2xl bg-[hsl(var(--muted))] px-3 py-2 text-sm leading-relaxed text-foreground",
        className,
      )}
    >
      {segs.map((s, i) =>
        s.type === "text" ? (
          <span key={i}>{s.value}</span>
        ) : (
          <span
            key={i}
            className="mx-0.5 inline-flex items-center rounded-md bg-primary/15 px-1.5 py-0.5 font-mono text-[0.75em] font-medium text-primary"
          >
            {`{{${s.value}}}`}
          </span>
        ),
      )}
    </div>
  );
}
