export type ProviderId = 'anthropic' | 'openai' | 'google' | 'openrouter' | 'custom';

export interface MemoryPolicy {
  recall: 'none' | 'task_summary' | 'full';
  charCap: number;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  provider: ProviderId;
  model: string;
  allowedTools: string[];
  memoryPolicy: MemoryPolicy;
  maxTurns: number;
  temperature: number;
}

export interface Project {
  id: string;
  name: string;
  rootPath: string;
  accentColor?: string;
  createdAt: string;
}

export type SessionStatus = 'active' | 'ended';

export interface Session {
  id: string;
  projectId: string;
  taskSummary: string;
  status: SessionStatus;
  orchestratorModel: string;
  startedAt: string;
  endedAt?: string;
}

export type MessageRole = 'user' | 'ai' | 'thought' | 'actions' | 'diff';

export interface Message {
  id: string;
  sessionId: string;
  agentId?: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export type TaskState = 'todo' | 'in_progress' | 'review' | 'done';

export interface Task {
  id: string;
  sessionId: string;
  title: string;
  state: TaskState;
  assigneeAgentId?: string;
}

export type ApprovalLevel = 'confirm' | 'blocked' | 'auto';
export type ApprovalDecision = 'approved' | 'rejected';

export interface ApprovalRequest {
  id: string;
  sessionId: string;
  agentId: string;
  action: string;
  target: string;
  riskNote: string;
  level: ApprovalLevel;
  decision?: ApprovalDecision;
  decidedAt?: string;
}

export type RunState =
  | 'idle'
  | 'assembling'
  | 'running'
  | 'awaiting_approval'
  | 'paused'
  | 'done'
  | 'failed';

export interface UsageRecord {
  id: string;
  sessionId: string;
  agentId?: string;
  provider: ProviderId;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costEstimate: number;
  requestCount: number;
  date: string;
}

export interface CustomProviderDescriptor {
  name: string;
  baseUrl: string;
}

export interface ProviderConfig {
  provider: ProviderId;
  keyAlias?: string;
  keyHint?: string;
  custom?: CustomProviderDescriptor;
}

export interface MemoryNote {
  id: string;
  agentId: string;
  filePath: string;
  charCount: number;
  tags: string[];
  updatedAt: string;
}

export interface SkillMeta {
  name: string;
  path: string;
  description: string;
  assignedAgentIds: string[];
}