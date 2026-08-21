import { MoreHorizontal, Play, Pause, Copy, Pencil, Trash2, FlaskConical, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FlowRow } from "../types";

interface Props {
  flow: FlowRow;
  onView: (f: FlowRow) => void;
  onEdit: (f: FlowRow) => void;
  onTest: (f: FlowRow) => void;
  onToggle: (f: FlowRow) => void;
  onDuplicate: (f: FlowRow) => void;
  onArchive: (f: FlowRow) => void;
}

export function FlowActionsMenu({
  flow,
  onView,
  onEdit,
  onTest,
  onToggle,
  onDuplicate,
  onArchive,
}: Props) {
  const canToggle = flow.status === "active" || flow.status === "paused" || flow.status === "draft";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Flow actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => onView(flow)}>
          <Eye className="mr-2 h-4 w-4" /> View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(flow)}>
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onTest(flow)}>
          <FlaskConical className="mr-2 h-4 w-4" /> Test flow
        </DropdownMenuItem>
        {canToggle ? (
          <DropdownMenuItem onClick={() => onToggle(flow)}>
            {flow.status === "active" ? (
              <>
                <Pause className="mr-2 h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Enable
              </>
            )}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={() => onDuplicate(flow)}>
          <Copy className="mr-2 h-4 w-4" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onArchive(flow)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
