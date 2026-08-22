import { useState } from 'react';
import type { Agent } from '@acute/shared';
import { AgentEditor } from '../../components/agents/AgentEditor';
import { CopyIcon, PencilIcon, PlusIcon, SparklesIcon, TrashIcon } from '../../components/icons';
import {
  EmptyState,
  IconButton,
  Panel,
  Pill,
  PrimaryButton,
} from '../../components/ui/primitives';
import { PROVIDER_LABELS, emptyAgent, useAgentsStore } from '../../stores/agents.store';

export default function AgentsView() {
  const agents = useAgentsStore((s) => s.agents);
  const addAgent = useAgentsStore((s) => s.addAgent);
  const updateAgent = useAgentsStore((s) => s.updateAgent);
  const removeAgent = useAgentsStore((s) => s.removeAgent);
  const duplicateAgent = useAgentsStore((s) => s.duplicateAgent);

  const [editing, setEditing] = useState<Agent | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function openNew() {
    setEditing(emptyAgent());
  }

  function handleSave(agent: Agent) {
    const exists = agents.some((a) => a.id === agent.id);
    if (exists) updateAgent(agent);
    else addAgent(agent);
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (confirmDeleteId === id) {
      removeAgent(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId((current) => (current === id ? null : current)), 2500);
    }
  }

  return (
    <div className="custom-scrollbar h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 pb-16 pt-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-black tracking-tightest text-foreground">Agent registry</h1>
            <p className="mt-1 text-[12px] font-medium text-muted-foreground">
              Your local roster — roles, prompts, models and tool access. Stored on this device.
            </p>
          </div>
          <PrimaryButton bento onClick={openNew}>
            <PlusIcon size={13} strokeWidth={2.5} /> New agent
          </PrimaryButton>
        </header>

        {agents.length === 0 ? (
          <Panel>
            <EmptyState
              icon={<SparklesIcon size={20} />}
              title="No agents yet"
              body="Create your first agent to give it a role, a model and a toolbox."
              action={
                <PrimaryButton onClick={openNew}>
                  <PlusIcon size={13} /> New agent
                </PrimaryButton>
              }
            />
          </Panel>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {agents.map((agent) => (
              <Panel key={agent.id} className="group p-4 transition-transform duration-200 hover:-translate-y-0.5">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft font-mono text-[15px] font-bold text-accent">
                    {agent.name.charAt(0).toUpperCase() || '?'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[14px] font-bold tracking-tight text-foreground">{agent.name}</h3>
                      <Pill tone="accent">{agent.role}</Pill>
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="chip-mono">{agent.model}</span>
                      <span className="chip-mono">{PROVIDER_LABELS[agent.provider]}</span>
                      <span className="chip-mono">{agent.allowedTools.length} tools</span>
                    </p>
                    <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                      {agent.systemPrompt || 'No system prompt yet.'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
                    <IconButton label={`Edit ${agent.name}`} onClick={() => setEditing(agent)}>
                      <PencilIcon size={13} />
                    </IconButton>
                    <IconButton label={`Duplicate ${agent.name}`} onClick={() => duplicateAgent(agent.id)}>
                      <CopyIcon size={13} />
                    </IconButton>
                    <IconButton
      label={confirmDeleteId === agent.id ? 'Click again to confirm' : `Delete ${agent.name}`}
                      destructive={confirmDeleteId === agent.id}
                      onClick={() => handleDelete(agent.id)}
                    >
                      <TrashIcon size={13} />
                    </IconButton>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </div>

      {editing ? <AgentEditor agent={editing} onClose={() => setEditing(null)} onSave={handleSave} /> : null}
    </div>
  );
}
