import { useEffect, useState } from 'react';
import type { Agent, MemoryPolicy, ProviderId } from '@acute/shared';
import {
  AGENT_ROLES,
  AGENT_TOOLS,
  PROVIDER_LABELS,
  PROVIDER_MODELS,
} from '../../stores/agents.store';
import type { AgentRole } from '../../stores/agents.store';
import { XIcon } from '../icons';
import { FieldLabel, GhostButton, PrimaryButton, inputClass, selectClass, textareaClass } from '../ui/primitives';

export interface AgentEditorProps {
  agent: Agent;
  onClose: () => void;
  onSave: (agent: Agent) => void;
}

export function AgentEditor({ agent, onClose, onSave }: AgentEditorProps) {
  const [draft, setDraft] = useState<Agent>(agent);
  const [customRole, setCustomRole] = useState(!AGENT_ROLES.includes(agent.role as AgentRole));

  useEffect(() => {
    setDraft(agent);
    setCustomRole(!AGENT_ROLES.includes(agent.role as AgentRole));
  }, [agent]);

  function patch(part: Partial<Agent>) {
    setDraft((prev) => ({ ...prev, ...part }));
  }

  function toggleTool(tool: string) {
    setDraft((prev) => ({
      ...prev,
      allowedTools: prev.allowedTools.includes(tool)
        ? prev.allowedTools.filter((t) => t !== tool)
        : [...prev.allowedTools, tool],
    }));
  }

  const canSave = draft.name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close editor"
        className="absolute inset-0 animate-fade-in bg-black/25"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-[420px] max-w-full animate-slide-in-right flex-col border-l border-border bg-card shadow-drag">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
          <h2 className="text-[13px] font-bold tracking-tight text-foreground">{agent.name ? 'Edit agent' : 'New agent'}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <XIcon size={14} />
          </button>
        </header>

        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div>
            <FieldLabel htmlFor="agent-name">Name</FieldLabel>
            <input
              id="agent-name"
              className={inputClass}
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="Nova"
            />
          </div>

          <div>
            <FieldLabel htmlFor="agent-role">Role</FieldLabel>
            {!customRole ? (
              <select
                id="agent-role"
                className={selectClass}
                value={draft.role}
                onChange={(e) => {
                  if (e.target.value === '__custom') {
                    setCustomRole(true);
                    patch({ role: '' });
                  } else {
                    patch({ role: e.target.value });
                  }
                }}
              >
                {AGENT_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
                <option value="__custom">Custom…</option>
              </select>
            ) : (
              <input
                className={inputClass}
                value={draft.role}
                onChange={(e) => patch({ role: e.target.value })}
                placeholder="Orchestrator"
                autoFocus
              />
            )}
          </div>

          <div>
            <FieldLabel htmlFor="agent-prompt">System prompt</FieldLabel>
            <textarea
              id="agent-prompt"
              rows={5}
              className={textareaClass}
              value={draft.systemPrompt}
              onChange={(e) => patch({ systemPrompt: e.target.value })}
              placeholder="You are the …"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="agent-provider">Provider</FieldLabel>
              <select
                id="agent-provider"
                className={selectClass}
                value={draft.provider}
                onChange={(e) => {
                  const provider = e.target.value as ProviderId;
                  patch({ provider, model: PROVIDER_MODELS[provider][0] });
                }}
              >
                {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((id) => (
                  <option key={id} value={id}>
                    {PROVIDER_LABELS[id]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="agent-model">Model</FieldLabel>
              <select
                id="agent-model"
                className={`${selectClass} font-mono`}
                value={draft.model}
                onChange={(e) => patch({ model: e.target.value })}
              >
                {PROVIDER_MODELS[draft.provider].map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>Allowed tools</FieldLabel>
            <div className="grid grid-cols-2 gap-1.5">
              {AGENT_TOOLS.map((tool) => {
                const checked = draft.allowedTools.includes(tool);
                return (
                  <label
                    key={tool}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 font-mono text-[11px] transition-colors ${
                      checked ? 'border-accent bg-accent-soft text-foreground' : 'border-border bg-input text-muted-foreground'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-3 w-3 accent-[var(--accent)]"
                      checked={checked}
                      onChange={() => toggleTool(tool)}
                    />
                    {tool}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="agent-turns">Max turns</FieldLabel>
              <input
                id="agent-turns"
                type="number"
                min={1}
                max={64}
                className={inputClass}
                value={draft.maxTurns}
                onChange={(e) => patch({ maxTurns: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
            <div>
              <FieldLabel>Temperature · <span className="font-mono normal-case tracking-normal">{draft.temperature.toFixed(1)}</span></FieldLabel>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={draft.temperature}
                onChange={(e) => patch({ temperature: Number(e.target.value) })}
                className="mt-2.5 w-full"
              />
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="agent-memory">Memory policy</FieldLabel>
            <select
              id="agent-memory"
              className={selectClass}
              value={draft.memoryPolicy.recall}
              onChange={(e) =>
                patch({
                  memoryPolicy: { ...draft.memoryPolicy, recall: e.target.value as MemoryPolicy['recall'] },
                })
              }
            >
              <option value="none">None — stateless turns</option>
              <option value="task_summary">Task summary — rolling digest</option>
              <option value="full">Full — complete session context</option>
            </select>
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border p-4">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton disabled={!canSave} onClick={() => onSave(draft)}>
            Save agent
          </PrimaryButton>
        </footer>
      </aside>
    </div>
  );
}
