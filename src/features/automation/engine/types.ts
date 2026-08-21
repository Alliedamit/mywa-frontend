import type { FlowActionType, FlowRow, FlowTrigger } from "@/features/flows/types";

export type AutomationEventType = FlowTrigger;

export interface AutomationEvent {
  type: AutomationEventType;
  workspaceId: string;
  payload: EventPayload;
  occurredAt?: string;
  isTest?: boolean;
}

export interface EventPayload {
  // free-form; well-known keys used by the engine
  text?: string;
  contactId?: string | null;
  conversationId?: string | null;
  tags?: string[];
  time?: string; // HH:mm
  day?: string; // monday..sunday
  templateId?: string | null;
  mediaId?: string | null;
  [k: string]: unknown;
}

export interface ResolvedAction {
  action_type: FlowActionType;
  payload: Record<string, unknown>;
}

export interface ConditionResult {
  passed: boolean;
  details: string[];
}

export interface ExecutionResult {
  flowId: string;
  executionId: string;
  matched: boolean;
  actionsQueued: number;
  actionsExecuted: number;
  actionsWaiting: number;
  actionsFailed: number;
  error?: string;
}

export interface RunEventResult {
  matchedFlows: number;
  executions: ExecutionResult[];
}

export type QueueStatus =
  "pending" | "running" | "completed" | "failed" | "cancelled" | "waiting_whatsapp";

export type ExecutionStatus =
  "pending" | "running" | "success" | "failed" | "skipped" | "simulated";

export type EngineFlow = FlowRow;
