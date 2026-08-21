import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRESETS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#64748b",
];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function ColorPicker({ value, onChange }: Props) {
  const [hex, setHex] = useState(value);
  useEffect(() => setHex(value), [value]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-9 gap-1.5">
        {PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Select color ${c}`}
            onClick={() => onChange(c)}
            className={cn(
              "h-6 w-6 rounded-md border border-border/60 transition-transform hover:scale-110",
              value.toLowerCase() === c && "ring-2 ring-ring ring-offset-2 ring-offset-background",
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span
          className="h-8 w-8 shrink-0 rounded-md border border-border/60"
          style={{ backgroundColor: value }}
        />
        <Input
          value={hex}
          onChange={(e) => {
            const v = e.target.value;
            setHex(v);
            if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) onChange(v);
          }}
          placeholder="#3b82f6"
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}
