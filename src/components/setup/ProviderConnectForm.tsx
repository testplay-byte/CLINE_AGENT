import { useState } from 'react';
import type { FormEvent } from 'react';
import { CheckIcon, ZapIcon } from '../icons';
import { FieldLabel, Pill, inputClass } from '../ui/primitives';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

type PresetId = 'openrouter' | 'custom';

interface TestResult {
  kind: 'success' | 'error';
  message: string;
}

interface ProviderConnectFormProps {
  onConnected?: (provider: { id: PresetId; name: string; baseUrl: string }) => void;
}

export function ProviderConnectForm({ onConnected }: ProviderConnectFormProps) {
  const [preset, setPreset] = useState<PresetId>('openrouter');
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState(OPENROUTER_BASE_URL);
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const canTest = baseUrl.trim().length > 8 && apiKey.trim().length > 0 && !testing;

  function selectPreset(id: PresetId) {
    setPreset(id);
    setResult(null);
    setBaseUrl(id === 'openrouter' ? OPENROUTER_BASE_URL : '');
    setName(id === 'openrouter' ? 'OpenRouter' : '');
  }

  async function handleTest(e: FormEvent) {
    e.preventDefault();
    if (!canTest) return;
    setTesting(true);
    setResult(null);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${baseUrl.trim().replace(/\/+$/, '')}/models`, {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        setResult({ kind: 'error', message: `Provider responded ${res.status}. Check the key and base URL.` });
        return;
      }

      const body: unknown = await res.json();
      const count = extractModelCount(body);
      setResult({ kind: 'success', message: count > 0 ? `Connected · ${count} models available` : 'Connected' });
      onConnected?.({ id: preset, name: displayName(), baseUrl: baseUrl.trim() });
    } catch (err) {
      const reason = err instanceof Error && err.name === 'AbortError' ? 'Timed out after 8s.' : 'Unreachable from the renderer (network or CORS).';
      setResult({ kind: 'error', message: `${reason} The sidecar proxy handles this in production.` });
    } finally {
      setTesting(false);
    }
  }

  function displayName(): string {
    return preset === 'openrouter' ? 'OpenRouter' : name.trim() || 'Custom provider';
  }

  const testTooltip = !canTest
    ? testing
      ? 'Testing…'
      : apiKey.trim().length === 0
        ? 'Enter an API key to test'
        : 'Enter a valid base URL to test'
    : 'GET {baseURL}/models with your key';

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2.5">
        <PresetCard
          active={preset === 'openrouter'}
          letter="R"
          title="OpenRouter"
          body="One key, hundreds of models."
          onClick={() => selectPreset('openrouter')}
        />
        <PresetCard
          active={preset === 'custom'}
          letter="⚡"
          title="Custom OpenAI-compatible"
          body="Any /v1 endpoint that speaks OpenAI."
          onClick={() => selectPreset('custom')}
        />
      </div>

      {preset === 'custom' ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="provider-name">Name</FieldLabel>
            <input
              id="provider-name"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My gateway"
            />
          </div>
          <div>
            <FieldLabel htmlFor="provider-base-url">Base URL</FieldLabel>
            <input
              id="provider-base-url"
              className={`${inputClass} font-mono`}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://your-host/v1"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2">
          <span className="text-[11px] font-semibold text-muted-foreground">Base URL</span>
          <code className="font-mono text-[11px] text-foreground">{OPENROUTER_BASE_URL}</code>
        </div>
      )}

      <div>
        <FieldLabel htmlFor="provider-key">API key</FieldLabel>
        <input
          id="provider-key"
          type="password"
          autoComplete="off"
          className={`${inputClass} font-mono`}
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setResult(null);
          }}
          placeholder="sk-or-v1-…"
        />
        <p className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
          <ZapIcon size={10} className="text-accent" /> Stored locally on this device — never synced or logged.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleTest}
          disabled={!canTest}
          title={testTooltip}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border-[1.5px] border-border bg-card px-3.5 text-[12px] font-bold text-foreground shadow-bento-sm transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-40"
        >
          {testing ? 'Testing…' : 'Test connection'}
        </button>
        {result ? (
          <Pill tone={result.kind === 'success' ? 'success' : 'destructive'}>
            {result.kind === 'success' ? <CheckIcon size={10} strokeWidth={3} /> : null}
            {result.message}
          </Pill>
        ) : null}
      </div>
    </div>
  );
}

function PresetCard({
  active,
  letter,
  title,
  body,
  onClick,
}: {
  active: boolean;
  letter: string;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border-[1.5px] p-3 text-left transition-all hover:-translate-y-0.5 ${
        active ? 'border-accent bg-accent-soft shadow-bento-sm' : 'border-border bg-card'
      }`}
    >
      <span className="flex items-center gap-2">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border font-mono text-[12px] font-bold ${
            active ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          {letter}
        </span>
        <span className="text-[12px] font-bold leading-tight text-foreground">{title}</span>
      </span>
      <span className="mt-1.5 block text-[11px] leading-snug text-muted-foreground">{body}</span>
    </button>
  );
}

function extractModelCount(body: unknown): number {
  if (body && typeof body === 'object' && 'data' in body) {
    const data = (body as { data?: unknown }).data;
    if (Array.isArray(data)) return data.length;
  }
  if (Array.isArray(body)) return body.length;
  return 0;
}
