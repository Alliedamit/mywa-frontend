import {
  MessageSquare,
  Send,
  UserPlus,
  FileText,
  Image as ImageIcon,
  Clock,
  Type,
  Tag,
  CalendarDays,
  Zap,
  Bookmark,
  Bell,
  StickyNote,
  Star,
  Paperclip,
  Minus,
  Plus,
  Timer,
  type LucideIcon,
} from "lucide-react";
import type { FlowActionType, FlowConditionField, FlowTrigger } from "./types";

export interface TriggerDef {
  value: FlowTrigger;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const TRIGGERS: TriggerDef[] = [
  {
    value: "message_received",
    label: "Message received",
    description: "When a new inbound message arrives.",
    icon: MessageSquare,
  },
  {
    value: "message_sent",
    label: "Message sent",
    description: "When you send an outbound message.",
    icon: Send,
  },
  {
    value: "contact_added",
    label: "Contact added",
    description: "When a new contact is created.",
    icon: UserPlus,
  },
  {
    value: "template_used",
    label: "Template used",
    description: "When a template is inserted into a conversation.",
    icon: FileText,
  },
  {
    value: "media_saved",
    label: "Media saved",
    description: "When an attachment is saved to the library.",
    icon: ImageIcon,
  },
  {
    value: "scheduled_time",
    label: "Scheduled time",
    description: "At a recurring time of day (definable, not yet fired).",
    icon: Clock,
  },
];

export interface ConditionDef {
  value: FlowConditionField;
  label: string;
  operators: { value: string; label: string }[];
  placeholder?: string;
  icon: LucideIcon;
}

export const CONDITIONS: ConditionDef[] = [
  {
    value: "message_text",
    label: "Message text",
    icon: Type,
    placeholder: "hello",
    operators: [
      { value: "contains", label: "contains" },
      { value: "starts_with", label: "starts with" },
      { value: "ends_with", label: "ends with" },
      { value: "equals", label: "equals" },
    ],
  },
  {
    value: "contact_tag",
    label: "Contact tag",
    icon: Tag,
    placeholder: "vip",
    operators: [{ value: "has_tag", label: "has tag" }],
  },
  {
    value: "time_of_day",
    label: "Time of day",
    icon: Clock,
    placeholder: "09:00",
    operators: [{ value: "at_time", label: "at" }],
  },
  {
    value: "day_of_week",
    label: "Day of week",
    icon: CalendarDays,
    placeholder: "monday",
    operators: [{ value: "on_day", label: "on" }],
  },
  {
    value: "always",
    label: "Always",
    icon: Zap,
    operators: [{ value: "always", label: "always" }],
  },
];

export interface ActionDef {
  value: FlowActionType;
  label: string;
  description: string;
  icon: LucideIcon;
  disabled?: boolean;
  paramKind: "template" | "media" | "tag" | "text" | "none";
}

export const ACTIONS: ActionDef[] = [
  {
    value: "insert_template",
    label: "Insert template",
    description: "Pick a saved template to insert.",
    icon: FileText,
    paramKind: "template",
  },
  {
    value: "attach_media",
    label: "Attach media",
    description: "Attach a file from the media library.",
    icon: Paperclip,
    paramKind: "media",
  },
  {
    value: "add_tag",
    label: "Add tag",
    description: "Apply a tag to the contact.",
    icon: Plus,
    paramKind: "tag",
  },
  {
    value: "remove_tag",
    label: "Remove tag",
    description: "Remove a tag from the contact.",
    icon: Minus,
    paramKind: "tag",
  },
  {
    value: "create_note",
    label: "Create note",
    description: "Append a note to the contact.",
    icon: StickyNote,
    paramKind: "text",
  },
  {
    value: "mark_favorite",
    label: "Mark favorite",
    description: "Star the conversation.",
    icon: Star,
    paramKind: "none",
  },
  {
    value: "send_notification",
    label: "Send notification",
    description: "Show an internal alert.",
    icon: Bell,
    paramKind: "text",
  },
  {
    value: "delay",
    label: "Delay",
    description: "Wait before the next action (coming soon).",
    icon: Timer,
    paramKind: "text",
    disabled: true,
  },
];

export const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
] as const;

export const FLOW_ICONS = { Bookmark };
