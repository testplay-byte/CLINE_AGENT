'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Plus,
  Check,
  X,
  ChevronDown,
  Link,
  Key,
  Zap,
} from 'lucide-react';
import { useTheme, bdr, staggerContainer, staggerItem, fadeInUp, ease } from '@/lib/dashboard-helpers';
import { PROVIDERS, type Provider } from '@/lib/onboarding-types';

// ============================================================
// CONFIG HELPERS (matches SettingsView pattern)
// ============================================================
const CONFIG_KEY = 'acute-agent-config';

interface AiConfig {
  providerId: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  contextWindow: number;
  maxOutput: number;
  temperature: number;
  themeId: string;
  isDark: boolean;
  brainChoice: string;
}

const DEFAULT_CONFIG: AiConfig = {
  providerId: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  modelId: 'gpt-4o',
  contextWindow: 128000,
  maxOutput: 4096,
  temperature: 0.7,
  themeId: 'nova',
  isDark: false,
  brainChoice: 'balanced',
};

function loadConfig(): AiConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_CONFIG;
}

function saveConfig(cfg: Partial<AiConfig>) {
  try {
    const current = loadConfig();
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...current, ...cfg }));
  } catch {}
}

// ============================================================
// STATUS LOGIC
// ============================================================
type ModelStatus = 'connected' | 'demo' | 'offline';

function getModelStatus(apiKey: string, baseUrl: string): ModelStatus {
  if (!apiKey || apiKey.trim() === '') return 'offline';
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) return 'demo';
  return 'connected';
}

const STATUS_CONFIG: Record<ModelStatus, { label: string; color: string; dotColor: string }> = {
  connected: { label: 'Connected', color: '#22c55e', dotColor: '#22c55e' },
  demo: { label: 'Demo', color: '#f59e0b', dotColor: '#f59e0b' },
  offline: { label: 'No API Key', color: '#9ca3af', dotColor: '#9ca3af' },
};

// ============================================================
// MODEL CARD
// ============================================================
function ModelCard({
  provider,
  modelId,
  isActive,
  status,
  onClick,
  delay = 0,
}: {
  provider: Provider;
  modelId: string;
  isActive: boolean;
  status: ModelStatus;
  onClick: () => void;
  delay?: number;
}) {
  const { isDark, card, text, muted, accent, border, accentFaded } = useTheme();
  const statusCfg = STATUS_CONFIG[status];

  // Generate a consistent hue for each provider for the letter background
  const providerHue = useMemo(() => {
    const map: Record<string, string> = {
      openai: '#10a37f',
      anthropic: '#d4a574',
      gemini: '#4285f4',
      groq: '#f55036',
      openrouter: '#6366f1',
      mistral: '#ff7000',
      cohere: '#39d353',
      together: '#1a1a2e',
      deepseek: '#4d6bfe',
      'openai-compatible': '#8b5cf6',
    };
    return map[provider.id] || accent;
  }, [provider.id, accent]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease, delay }}
    >
      <div
        className="group p-4 rounded-xl cursor-pointer transition-all duration-200 relative"
        style={{
          backgroundColor: card,
          border: bdr('1.5px', isActive ? accent : border),
          boxShadow: isActive
            ? `0 0 0 1px ${accent}25, 0 2px 8px ${accent}15`
            : '0 1px 3px rgba(0,0,0,0.04)',
        }}
        onClick={onClick}
        onMouseEnter={(e) => {
          if (!isActive) {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = accent + '50';
            el.style.transform = 'translateY(-2px)';
            el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = border;
            el.style.transform = 'translateY(0)';
            el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
          }
        }}
      >
        {/* Active badge */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 right-3"
          >
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"
              style={{ backgroundColor: accent + '18', color: accent }}
            >
              <Check size={9} strokeWidth={3} />
              ACTIVE
            </span>
          </motion.div>
        )}

        <div className="flex items-start gap-3.5">
          {/* Provider letter avatar */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-[16px] font-bold"
            style={{
              backgroundColor: providerHue + (isDark ? '20' : '12'),
              color: providerHue,
              border: bdr('1px', providerHue + '30'),
            }}
          >
            {provider.letter}
          </div>

          <div className="flex-1 min-w-0">
            {/* Model name */}
            <h3 className="text-[13px] font-bold truncate mb-0.5" style={{ color: text }}>
              {modelId}
            </h3>

            {/* Provider name */}
            <p className="text-[11px] font-medium mb-3" style={{ color: muted }}>
              {provider.name}
            </p>

            {/* Status indicator */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                {status === 'connected' && (
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                    style={{ backgroundColor: statusCfg.dotColor }}
                  />
                )}
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: statusCfg.dotColor }}
                />
              </span>
              <span className="text-[10px] font-semibold" style={{ color: statusCfg.color }}>
                {statusCfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* Click hint on hover */}
        {!isActive && (
          <div
            className="mt-3 pt-2.5 flex items-center gap-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ color: accent, borderTop: bdr('1px', border) }}
          >
            <Zap size={10} />
            <span className="font-medium">Click to switch</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// ADD MODEL FORM
// ============================================================
function AddModelForm({ onClose }: { onClose: () => void }) {
  const { isDark, text, muted, accent, border, inputBg, card, accentFaded } = useTheme();
  const [providerId, setProviderId] = useState('openai');
  const [customModelId, setCustomModelId] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);

  const selectedProvider = PROVIDERS.find((p) => p.id === providerId) || PROVIDERS[0];
  const modelOptions = selectedProvider.models;

  const handleSubmit = useCallback(() => {
    const modelToSave = customModelId.trim() || modelOptions[0];
    const baseToSave = customBaseUrl.trim() || selectedProvider.baseUrl;
    saveConfig({
      providerId,
      modelId: modelToSave,
      baseUrl: baseToSave,
      apiKey: customApiKey.trim(),
    });
    onClose();
  }, [providerId, customModelId, customBaseUrl, customApiKey, modelOptions, selectedProvider.baseUrl, onClose]);

  const inputStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    border: bdr('1.5px', border),
    color: text,
    fontFamily: "'Space Grotesk', sans-serif",
  };

  const labelStyle: React.CSSProperties = { color: muted, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.3, ease }}
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: card, border: bdr('1.5px', accent + '30') }}
    >
      {/* Form header */}
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{ borderBottom: bdr('1px', border) }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: accentFaded }}
          >
            <Plus size={14} style={{ color: accent }} />
          </div>
          <span className="text-[12px] font-bold" style={{ color: text }}>
            Add Model
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-colors"
          style={{ color: muted }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Form body */}
      <div className="p-5 space-y-4">
        {/* Provider selector */}
        <div className="relative">
          <label className="block mb-1.5" style={labelStyle}>Provider</label>
          <button
            onClick={() => setShowProviderDropdown(!showProviderDropdown)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[12px] font-semibold cursor-pointer"
            style={{
              ...inputStyle,
              cursor: 'pointer',
            }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold"
                style={{
                  backgroundColor: (selectedProvider.id === 'openai' ? '#10a37f' : accent) + (isDark ? '20' : '12'),
                  color: selectedProvider.id === 'openai' ? '#10a37f' : accent,
                }}
              >
                {selectedProvider.letter}
              </span>
              {selectedProvider.name}
            </div>
            <ChevronDown size={13} style={{ color: muted }} />
          </button>

          <AnimatePresence>
            {showProviderDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease }}
                className="absolute z-50 top-full left-0 right-0 mt-1.5 rounded-lg overflow-hidden max-h-52 overflow-y-auto"
                style={{
                  backgroundColor: card,
                  border: bdr('1.5px', border),
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                }}
              >
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProviderId(p.id);
                      setShowProviderDropdown(false);
                      setCustomBaseUrl('');
                      setCustomModelId('');
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[11px] font-medium cursor-pointer transition-colors"
                    style={{
                      color: p.id === providerId ? accent : text,
                      backgroundColor: p.id === providerId ? accentFaded : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (p.id !== providerId) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (p.id !== providerId) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span
                      className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                      style={{
                        backgroundColor: (p.id === 'openai' ? '#10a37f' : accent) + (isDark ? '20' : '12'),
                        color: p.id === 'openai' ? '#10a37f' : accent,
                      }}
                    >
                      {p.letter}
                    </span>
                    {p.name}
                    {p.id === providerId && (
                      <Check size={11} className="ml-auto" style={{ color: accent }} />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Model selector */}
        <div>
          <label className="block mb-1.5" style={labelStyle}>Model</label>
          <div className="flex flex-wrap gap-1.5">
            {modelOptions.map((m) => (
              <button
                key={m}
                onClick={() => setCustomModelId(m)}
                className="px-2.5 py-1.5 rounded-md text-[10px] font-semibold cursor-pointer transition-all duration-150"
                style={{
                  backgroundColor: customModelId === m ? accent + '18' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  color: customModelId === m ? accent : muted,
                  border: bdr('1px', customModelId === m ? accent + '40' : 'transparent'),
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Custom model name (optional override) */}
        <div>
          <label className="block mb-1.5" style={labelStyle}>Custom Model ID (optional)</label>
          <input
            type="text"
            value={customModelId}
            onChange={(e) => setCustomModelId(e.target.value)}
            placeholder="e.g. my-fine-tuned-model"
            className="w-full px-3.5 py-2.5 rounded-lg text-[12px] outline-none"
            style={inputStyle}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = accent + '50'; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = border; }}
          />
        </div>

        {/* Base URL */}
        <div>
          <label className="block mb-1.5" style={labelStyle}>
            <span className="inline-flex items-center gap-1">
              <Link size={9} /> Base URL
            </span>
          </label>
          <input
            type="text"
            value={customBaseUrl || selectedProvider.baseUrl}
            onChange={(e) => setCustomBaseUrl(e.target.value)}
            placeholder="https://api.example.com/v1"
            className="w-full px-3.5 py-2.5 rounded-lg text-[12px] outline-none"
            style={inputStyle}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = accent + '50'; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = border; }}
          />
        </div>

        {/* API Key */}
        <div>
          <label className="block mb-1.5" style={labelStyle}>
            <span className="inline-flex items-center gap-1">
              <Key size={9} /> API Key
            </span>
          </label>
          <input
            type="password"
            value={customApiKey}
            onChange={(e) => setCustomApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-3.5 py-2.5 rounded-lg text-[12px] outline-none"
            style={inputStyle}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = accent + '50'; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = border; }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-bold cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
            style={{ backgroundColor: accent, color: '#fff' }}
          >
            <Check size={13} strokeWidth={3} />
            Save & Activate
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-[12px] font-semibold cursor-pointer"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              color: muted,
              border: bdr('1.5px', border),
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// MODELS VIEW
// ============================================================
export function ModelsView() {
  const { isDark, card, text, muted, accent, accentFaded, border } = useTheme();
  const [config, setConfig] = useState<AiConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    return loadConfig();
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Listen for storage changes (e.g. from Settings view)
  useEffect(() => {
    const handler = () => setConfig(loadConfig());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Build model cards list from all providers + their models
  const modelCards = useMemo(() => {
    const cards: { provider: Provider; modelId: string; status: ModelStatus; isActive: boolean }[] = [];
    for (const provider of PROVIDERS) {
      for (const modelId of provider.models) {
        const isActive = config.providerId === provider.id && config.modelId === modelId;
        const status = isActive
          ? getModelStatus(config.apiKey, config.baseUrl)
          : getModelStatus('', ''); // Non-active models show as offline
        cards.push({ provider, modelId, status, isActive });
      }
    }
    return cards;
  }, [config]);

  // Sort: active first, then connected, then demo, then offline
  const sortedCards = useMemo(() => {
    const order: Record<ModelStatus, number> = { connected: 0, demo: 1, offline: 2 };
    return [...modelCards].sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return order[a.status] - order[b.status];
    });
  }, [modelCards]);

  const handleSwitchModel = useCallback(
    (provider: Provider, modelId: string) => {
      const newConfig = {
        providerId: provider.id,
        modelId,
        baseUrl: provider.baseUrl,
      };
      saveConfig(newConfig);
      setConfig((prev) => ({ ...prev, ...newConfig }));
    },
    []
  );

  // Count stats
  const connectedCount = modelCards.filter((m) => m.status === 'connected').length;

  return (
    <motion.main
      key="models"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeInUp}
      className="flex-1 flex flex-col rounded-lg overflow-hidden min-w-0"
      style={{ backgroundColor: card, border: bdr('1.5px', border) }}
    >
      {/* Header */}
      <div
        className="px-4 md:px-5 py-3.5 flex items-center justify-between gap-3"
        style={{ borderBottom: bdr('1.5px', border) }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: accentFaded }}
          >
            <Brain size={15} style={{ color: accent }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[13px] font-bold" style={{ color: text }}>
              Models
            </h2>
            <p className="text-[10px]" style={{ color: muted }}>
              {modelCards.length} available · {connectedCount} connected
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!showAddForm && (
            <motion.button
              key="add-btn"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold cursor-pointer transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97] flex-shrink-0"
              style={{ backgroundColor: accent + 'DD', color: '#fff' }}
            >
              <Plus size={13} strokeWidth={2.5} />
              Add Model
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 custom-scrollbar">
        <AnimatePresence mode="wait">
          {showAddForm ? (
            <motion.div
              key="add-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AddModelForm onClose={() => setShowAddForm(false)} />
            </motion.div>
          ) : (
            <motion.div
              key="model-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Currently active indicator */}
              <div
                className="mb-4 p-3 rounded-lg flex items-center gap-2.5"
                style={{
                  backgroundColor: accentFaded,
                  border: bdr('1px', accent + '20'),
                }}
              >
                <Zap size={13} style={{ color: accent }} />
                <span className="text-[11px] font-semibold" style={{ color: accent }}>
                  Active:{' '}
                  <span style={{ color: text }}>{config.modelId}</span>
                  {' '}via{' '}
                  <span style={{ color: text }}>{PROVIDERS.find((p) => p.id === config.providerId)?.name || config.providerId}</span>
                </span>
              </div>

              {/* Model grid */}
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                {sortedCards.map((mc, i) => (
                  <motion.div key={`${mc.provider.id}-${mc.modelId}`} variants={staggerItem}>
                    <ModelCard
                      provider={mc.provider}
                      modelId={mc.modelId}
                      isActive={mc.isActive}
                      status={mc.status}
                      onClick={() => handleSwitchModel(mc.provider, mc.modelId)}
                      delay={i * 0.03}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Footer info */}
              <div className="mt-6 pt-4 flex items-center justify-center gap-4 text-[10px]" style={{ color: muted, borderTop: bdr('1px', border) }}>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                  Connected
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                  Demo
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#9ca3af' }} />
                  No Key
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  );
}
