export type FlowTrigger =
  | "message_received"
  | "message_sent"
  | "contact_added"
  | "template_used"
  | "media_saved"
  | "scheduled_time";

export type FlowConditionField =
  "message_text" | "contact_tag" | "time_of_day" | "day_of_week" | "always";

export type FlowConditionOperator =
  "contains" | "starts_with" | "ends_with" | "equals" | "has_tag" | "at_time" | "on_day" | "always";

export interface FlowCondition {
  id: string;
  field: FlowConditionField;
  operator: FlowConditionOperator;
  value: string;
  combinator: "and" | "or";
}

export type FlowActionType =
  | "insert_template"
  | "attach_media"
  | "add_tag"
  | "remove_tag"
  | "create_note"
  | "mark_favorite"
  | "send_notification"
  | "delay";

export interface FlowAction {
  id: string;
  type: FlowActionType;
  params: Record<string, string | number | boolean | null | undefined>;
}

export type FlowStatus = "draft" | "active" | "paused" | "archived";

export interface FlowRow {
  id: string;
  workspace_id: string;
  created_by: string | null;
  name: string;
  description: string | null;
  trigger: FlowTrigger;
  conditions: FlowCondition[];
  actions: FlowAction[];
  status: FlowStatus;
  run_count: number;
  last_run_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlowLogRow {
  id: string;
  flow_id: string;
  workspace_id: string;
  status: "success" | "failed" | "simulated";
  started_at: string;
  completed_at: string | null;
  message: string | null;
  execution_time_ms: number | null;
  created_at: string;
}
