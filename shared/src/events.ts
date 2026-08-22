import type { ApprovalRequest, RunState, TaskState, UsageRecord } from './types.js';

export interface WsEnvelope<TPayload = unknown> {
  type: WsEventType;
  sessionId: string;
  seq: number;
  payload: TPayload;
}

export interface AgentMessageDeltaPayload {
  messageId: string;
  agentId?: string;
  chunk: string;
}

export interface AgentMessageCompletePayload {
  messageId: string;
  content: string;
}

export interface TaskUpdatedPayload {
  taskId: string;
  state: TaskState;
}

export type ApprovalRequestedPayload = ApprovalRequest;

export interface RunStateChangedPayload {
  runState: RunState;
}

export type UsageRecordedPayload = UsageRecord;

export type WsEvent =
  | (WsEnvelope<AgentMessageDeltaPayload> & { type: 'agent.message.delta' })
  | (WsEnvelope<AgentMessageCompletePayload> & { type: 'agent.message.complete' })
  | (WsEnvelope<TaskUpdatedPayload> & { type: 'task.updated' })
  | (WsEnvelope<ApprovalRequestedPayload> & { type: 'approval.requested' })
  | (WsEnvelope<RunStateChangedPayload> & { type: 'run.state.changed' })
  | (WsEnvelope<UsageRecordedPayload> & { type: 'usage.recorded' });

/** Closed vocabulary of sidecar -> UI WebSocket events (ARCHITECTURE.md section 7). */
export type WsEventType =
  | 'agent.message.delta'
  | 'agent.message.complete'
  | 'task.updated'
  | 'approval.requested'
  | 'run.state.changed'
  | 'usage.recorded';