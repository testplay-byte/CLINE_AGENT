import { create } from 'zustand';
import type { Agent, MemoryPolicy, ProviderId } from '@acute/shared';

export const AGENT_ROLES = ['Planner', 'Researcher', 'Coder', 'Reviewer', 'Tester'] as const;
export type AgentRole = (typeof AGENT_ROLES)[number];

export const AGENT_TOOLS = [
  'read_files',
  'write_files',
  'run_shell',
  'git',
  'search_workspace',
  'test_runner',
] as const;

export const PROVIDER_MODELS: Record<ProviderId, string[]> = {
  openrouter: ['anthropic/claude-4-sonnet', 'openai/gpt-4o', 'google/gemini-2.5-pro'],
  anthropic: ['claude-4-sonnet', 'claude-4-opus', 'claude-3-5-haiku'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
  google: ['gemini-2.5-pro', 'gemini-2.0-flash'],
  custom: ['custom-model'],
};

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  openrouter: 'OpenRouter',
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  custom: 'Custom',
};

function policy(recall: MemoryPolicy['recall']): MemoryPolicy {
  return { recall, charCap: 12_000 };
}

export const TEMPLATE_AGENTS: Agent[] = [
  {
    id: 'tpl-planner',
    name: 'Atlas',
    role: 'Planner',
    systemPrompt:
      'You are the planning agent. Decompose the task into a minimal ordered plan with explicit acceptance checks. Never write implementation code.',
    provider: 'anthropic',
    model: 'claude-4-sonnet',
    allowedTools: ['read_files', 'search_workspace'],
    memoryPolicy: policy('task_summary'),
    maxTurns: 12,
    temperature: 0.3,
  },
  {
    id: 'tpl-researcher',
    name: 'Scout',
    role: 'Researcher',
    systemPrompt:
      'You are the research agent. Gather context from the workspace and summarize findings with file references. Cite paths for every claim.',
    provider: 'openai',
    model: 'gpt-4o-mini',
    allowedTools: ['read_files', 'search_workspace'],
    memoryPolicy: policy('task_summary'),
    maxTurns: 10,
    temperature: 0.2,
  },
  {
    id: 'tpl-coder',
    name: 'Forge',
    role: 'Coder',
    systemPrompt:
      'You are the implementation agent. Produce minimal diffs that satisfy the plan. Follow existing code style. Run the test runner after edits.',
    provider: 'anthropic',
    model: 'claude-4-sonnet',
    allowedTools: ['read_files', 'write_files', 'run_shell', 'git', 'test_runner'],
    memoryPolicy: policy('full'),
    maxTurns: 24,
    temperature: 0.2,
  },
  {
    id: 'tpl-reviewer',
    name: 'Lens',
    role: 'Reviewer',
    systemPrompt:
      'You are the review agent. Inspect diffs for correctness, security, and style drift. Report blocking vs. advisory findings separately.',
    provider: 'openai',
    model: 'gpt-4o',
    allowedTools: ['read_files', 'search_workspace'],
    memoryPolicy: policy('task_summary'),
    maxTurns: 8,
    temperature: 0.1,
  },
  {
    id: 'tpl-tester',
    name: 'Probe',
    role: 'Tester',
    systemPrompt:
      'You are the test agent. Write and run focused tests for the changed surface. Report pass/fail with the exact failing assertion.',
    provider: 'google',
    model: 'gemini-2.5-pro',
    allowedTools: ['read_files', 'write_files', 'run_shell', 'test_runner'],
    memoryPolicy: policy('none'),
    maxTurns: 16,
    temperature: 0.4,
  },
];

interface AgentsState {
  agents: Agent[];
  addAgent: (agent: Agent) => void;
  updateAgent: (agent: Agent) => void;
  removeAgent: (id: string) => void;
  duplicateAgent: (id: string) => void;
}

function freshId(): string {
  return `agent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useAgentsStore = create<AgentsState>((set) => ({
  agents: TEMPLATE_AGENTS,
  addAgent: (agent) => set((s) => ({ agents: [...s.agents, agent] })),
  updateAgent: (agent) => set((s) => ({ agents: s.agents.map((a) => (a.id === agent.id ? agent : a)) })),
  removeAgent: (id) => set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),
  duplicateAgent: (id) =>
    set((s) => {
      const src = s.agents.find((a) => a.id === id);
      if (!src) return s;
      const copy: Agent = { ...src, id: freshId(), name: `${src.name} copy` };
      return { agents: [...s.agents, copy] };
    }),
}));

export function emptyAgent(): Agent {
  return {
    id: freshId(),
    name: '',
    role: 'Coder',
    systemPrompt: '',
    provider: 'openrouter',
    model: PROVIDER_MODELS.openrouter[0],
    allowedTools: ['read_files'],
    memoryPolicy: policy('task_summary'),
    maxTurns: 12,
    temperature: 0.3,
  };
}
