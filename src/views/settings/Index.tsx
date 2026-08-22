import { useState } from 'react';
import type { MemoryPolicyId, ProviderConfig } from '../../stores/settings.store';
import { DEFAULT_DENYLIST, useSettingsStore } from '../../stores/settings.store';
import { ProviderConnectForm } from '../../components/setup/ProviderConnectForm';
import { AccentPicker, ModeToggle } from '../../components/theme/ThemeProvider';
import { CheckIcon, InfoIcon, PlusIcon, ShieldIcon } from '../../components/icons';
import {
  EmptyState,
  GhostButton,
  Panel,
  Pill,
  PrimaryButton,
  SectionCard,
  selectClass,
} from '../../components/ui/primitives';

export default function SettingsView() {
  const settings = useSettingsStore();
  const [denylistDraft, setDenylistDraft] = useState(settings.denylist.join('\n'));
  const [denylistSaved, setDenylistSaved] = useState(false);
  const [addingProvider, setAddingProvider] = useState(false);

  function saveDenylist() {
    const patterns = denylistDraft
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    settings.setDenylist(patterns);
    setDenylistSaved(true);
    setTimeout(() => setDenylistSaved(false), 2200);
  }

  function handleProviderConnected(provider: { id: string; name: string; baseUrl: string }) {
    const entry: ProviderConfig = {
      id: `${provider.id}-${Date.now().toString(36)}`,
      name: provider.name,
      baseUrl: provider.baseUrl,
    };
    settings.addProvider(entry);
  }

  return (
    <div className="custom-scrollbar h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 pb-16 pt-10">
        <header className="mb-6">
          <h1 className="text-[26px] font-black tracking-tightest text-foreground">Settings</h1>
          <p className="mt-1 text-[12px] font-medium text-muted-foreground">
            Appearance, providers, execution safety and memory — all stored locally.
          </p>
        </header>

        <div className="space-y-5">
          <SectionCard title="Appearance" caption="Mode and accent apply instantly across the app">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[200px_1fr]">
              <div>
                <p className="label-caps mb-2">Mode</p>
                <ModeToggle />
              </div>
              <div>
                <p className="label-caps mb-2">Accent</p>
                <AccentPicker />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Providers"
            caption="OpenAI-compatible endpoints used by your agents"
            actions={
              !addingProvider ? (
                <GhostButton onClick={() => setAddingProvider(true)}>
                  <PlusIcon size={12} /> Add provider
                </GhostButton>
              ) : undefined
            }
          >
            <p className="mb-3 flex items-start gap-1.5 rounded-xl border border-border bg-muted px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
              <ShieldIcon size={13} className="mt-0.5 shrink-0 text-accent" />
              Keys are stored locally on this device per ADR-0011 — never synced, logged, or included in exports.
            </p>

            {addingProvider ? (
              <div className="mb-4 animate-fade-in rounded-xl border border-border p-3.5">
                <ProviderConnectForm
                  onConnected={(provider) =>
                    handleProviderConnected({ ...provider })
                  }
                />
                <div className="mt-3 flex justify-end">
                  <GhostButton onClick={() => setAddingProvider(false)}>Done</GhostButton>
                </div>
              </div>
            ) : null}

            {settings.providers.length === 0 ? (
              <EmptyState
                icon={<PlusIcon size={20} />}
                title="No providers yet"
                body="Add OpenRouter or any OpenAI-compatible endpoint to power your agents."
              />
            ) : (
              <div className="space-y-2">
                {settings.providers.map((provider) => (
                  <div key={provider.id} className="flex items-center gap-3 rounded-xl border border-border bg-input px-3 py-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent-soft font-mono text-[11px] font-bold text-accent">
                      {provider.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-foreground">{provider.name}</p>
                      <p className="truncate font-mono text-[10px] text-muted-foreground">{provider.baseUrl}</p>
                    </div>
                    <Pill>key •••• local</Pill>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-muted-foreground transition-colors hover:text-destructive"
                      onClick={() => settings.removeProvider(provider.id)}
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Execution & denylist"
            caption="Shell patterns always blocked before approval (static copy of agent-core defaults)"
            actions={
              denylistSaved ? (
                <Pill tone="success">
                  <CheckIcon size={10} strokeWidth={3} /> saved
                </Pill>
              ) : undefined
            }
          >
            <textarea
              rows={8}
              spellCheck={false}
              className="w-full resize-y rounded-lg border border-border bg-input px-3 py-2 font-mono text-[11.5px] leading-relaxed text-foreground focus:border-accent"
              value={denylistDraft}
              onChange={(e) => setDenylistDraft(e.target.value)}
            />
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                className="text-[11px] font-semibold text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
                onClick={() => setDenylistDraft(DEFAULT_DENYLIST.join('\n'))}
              >
                Reset to defaults
              </button>
              <PrimaryButton onClick={saveDenylist}>Save patterns</PrimaryButton>
            </div>
          </SectionCard>

          <SectionCard title="Memory" caption="Defaults applied to new agents">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="label-caps mb-2">Default policy</p>
                <select
                  className={selectClass}
                  value={settings.memoryPolicy}
                  onChange={(e) => settings.setMemoryPolicy(e.target.value as MemoryPolicyId)}
                >
                  <option value="none">None — stateless turns</option>
                  <option value="task_summary">Task summary — rolling digest</option>
                  <option value="full">Full — complete session context</option>
                </select>
              </div>
              <div>
                <p className="label-caps mb-2">Checkpoint retention</p>
                <select
                  className={selectClass}
                  value={settings.checkpointRetentionDays}
                  onChange={(e) => settings.setCheckpointRetentionDays(Number(e.target.value) as 7 | 30 | 90)}
                >
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Audit log" caption="Approvals and denials will be recorded here">
            <EmptyState
              icon={<InfoIcon size={20} />}
              title="No audit entries yet"
              body="Every approval decision lands here once sessions start running."
            />
          </SectionCard>

          <Panel className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-[13px] font-bold tracking-tight text-foreground">ACUTE CODE</p>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">v0.1.0 · phase 1</p>
            </div>
            <div className="flex items-center gap-2">
              <Pill>local-first</Pill>
              <Pill>closed-source</Pill>
              <Pill>all processing on this device</Pill>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

