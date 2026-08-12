'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Moon,
  Sun,
  Brain,
  Key,
  Link,
  ChevronDown,
  Eye,
  EyeOff,
  Sliders,
  Thermometer,
  Hash,
  FileText,
  Info,
  Check,
  Zap,
} from 'lucide-react';
import { useTheme, bdr, fadeInUp, ease } from '@/lib/dashboard-helpers';
import { useDashboardStore } from '@/lib/dashboard-store';
import { THEMES, PROVIDERS } from '@/lib/onboarding-types';

// ============================================================
// CONFIG HELPERS
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
// SECTION CARD WRAPPER
// ============================================================
function SectionCard({
  title,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: number;
}) {
  const { card, border, text, accent, accentSoft } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease, delay }}
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: card,
        border: bdr('1.5px', border),
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)',
      }}
    >
      {/* Section header */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ borderBottom: bdr('1px', border) }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: accentSoft }}
        >
          <Icon size={15} style={{ color: accent, opacity: 0.8 }} />
        </div>
        <h2
          className="text-[14px] font-bold tracking-tight"
          style={{ color: text, fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {title}
        </h2>
      </div>

      {/* Section body */}
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

// ============================================================
// SETTINGS VIEW
// ============================================================
export function SettingsView() {
  const { isDark, bg, card, border, text, muted, inputBg, accent, accent2, hover, accentFaded, accentSoft } =
    useTheme();

  // Store actions
  const storeThemeId = useDashboardStore((s) => s.themeId);
  const storeIsDark = useDashboardStore((s) => s.isDark);
  const setTheme = useDashboardStore((s) => s.setTheme);
  const toggleDark = useDashboardStore((s) => s.toggleDark);

  // Local state for config
  const [config, setConfig] = useState<AiConfig>(DEFAULT_CONFIG);
  const [showApiKey, setShowApiKey] = useState(false);
  const [providerOpen, setProviderOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const providerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  // Load config from localStorage on mount
  useEffect(() => {
    const stored = loadConfig();
    setConfig(stored);
  }, []);

  // Sync theme from store to config (on mount)
  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      themeId: storeThemeId,
      isDark: storeIsDark,
    }));
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (providerRef.current && !providerRef.current.contains(e.target as Node)) {
        setProviderOpen(false);
      }
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Current provider/models
  const currentProvider = PROVIDERS.find((p) => p.id === config.providerId) || PROVIDERS[0];
  const currentModels = currentProvider.models;

  // Helpers
  const updateConfig = useCallback(
    (patch: Partial<AiConfig>) => {
      setConfig((prev) => {
        const next = { ...prev, ...patch };
        saveConfig(next);
        return next;
      });
    },
    [],
  );

  const handleThemeChange = useCallback(
    (id: string) => {
      setTheme(id);
      updateConfig({ themeId: id });
    },
    [setTheme, updateConfig],
  );

  const handleDarkToggle = useCallback(() => {
    toggleDark();
    updateConfig({ isDark: !isDark });
  }, [toggleDark, isDark, updateConfig]);

  const handleProviderChange = useCallback(
    (providerId: string) => {
      const provider = PROVIDERS.find((p) => p.id === providerId);
      if (provider) {
        updateConfig({
          providerId,
          baseUrl: provider.baseUrl,
          modelId: provider.models[0],
        });
        setProviderOpen(false);
      }
    },
    [updateConfig],
  );

  // Mask API key
  const maskedKey = config.apiKey
    ? config.apiKey.slice(0, 6) + '•'.repeat(Math.max(0, config.apiKey.length - 10)) + config.apiKey.slice(-4)
    : '';

  // Slider track fill percentage
  const tempPercent = ((config.temperature - 0) / 2) * 100;

  const inputStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    border: bdr('1.5px', border),
    color: text,
    fontFamily: "'Space Grotesk', sans-serif",
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  return (
    <motion.div
      key="settings"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeInUp}
      className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar"
    >
      <div className="max-w-2xl mx-auto relative pb-24">
        {/* Decorative blobs */}
        <div
          className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: accent, opacity: 0.04 }}
        />

        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-6 pt-2"
        >
          <h1
            className="text-2xl md:text-3xl font-bold tracking-tight"
            style={{
              color: text,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Settings
          </h1>
          <p className="text-[13px] mt-1.5" style={{ color: muted }}>
            Configure your workspace, model, and appearance preferences.
          </p>
        </motion.div>

        <div className="space-y-4">
          {/* ============ THEME SETTINGS ============ */}
          <SectionCard title="Appearance" icon={Palette} delay={0.05}>
            {/* Dark / Light toggle */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <Moon size={14} style={{ color: isDark ? accent : muted }} />
                <span className="text-[13px] font-medium" style={{ color: text }}>
                  Dark Mode
                </span>
              </div>
              <button
                onClick={handleDarkToggle}
                className="relative w-11 h-6 rounded-full transition-all duration-300 cursor-pointer"
                style={{
                  backgroundColor: isDark ? accent : 'rgba(0,0,0,0.08)',
                  boxShadow: isDark ? `0 0 12px ${accent}30` : 'none',
                }}
              >
                <motion.div
                  animate={{ x: isDark ? 22 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }}
                >
                  {isDark ? (
                    <Moon size={9} style={{ color: accent }} />
                  ) : (
                    <Sun size={9} style={{ color: '#F59E0B' }} />
                  )}
                </motion.div>
              </button>
            </div>

            {/* Theme grid */}
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: muted }}>
              Theme
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {THEMES.map((theme) => {
                const isActive = config.themeId === theme.id;
                return (
                  <motion.button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative rounded-xl overflow-hidden cursor-pointer text-left"
                    style={{
                      border: bdr('2px', isActive ? theme.accent : border),
                      boxShadow: isActive
                        ? `0 0 0 1px ${theme.accent}25, 0 2px 8px ${theme.accent}15`
                        : '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    {/* Palette preview strip */}
                    <div className="flex h-10">
                      {theme.paletteLight.map((c, i) => (
                        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    {/* Label area */}
                    <div
                      className="px-3 py-2.5 flex items-center justify-between"
                      style={{
                        backgroundColor: isDark ? theme.cardDark : theme.cardLight,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: theme.accent }}
                        />
                        <span
                          className="text-[11px] font-semibold"
                          style={{
                            color: isDark ? theme.textDark : theme.textLight,
                            fontFamily: "'Space Grotesk', sans-serif",
                          }}
                        >
                          {theme.name}
                        </span>
                      </div>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                          <Check size={13} style={{ color: theme.accent }} />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </SectionCard>

          {/* ============ MODEL / BRAIN SETTINGS ============ */}
          <SectionCard title="Model & Brain" icon={Brain} delay={0.1}>
            <div className="space-y-4">
              {/* Provider selector */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: muted }}>
                  Provider
                </label>
                <div ref={providerRef} className="relative">
                  <button
                    onClick={() => {
                      setProviderOpen(!providerOpen);
                      setModelOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-medium cursor-pointer"
                    style={inputStyle}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: currentProvider.id === 'openai' ? '#10A37F' : accent }}
                      >
                        {currentProvider.letter}
                      </span>
                      {currentProvider.name}
                    </span>
                    <ChevronDown
                      size={14}
                      style={{
                        color: muted,
                        transform: providerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>
                  <AnimatePresence>
                    {providerOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease }}
                        className="absolute z-50 top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden max-h-56 overflow-y-auto custom-scrollbar"
                        style={{
                          backgroundColor: card,
                          border: bdr('1.5px', border),
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
                        }}
                      >
                        {PROVIDERS.map((p) => {
                          const active = p.id === config.providerId;
                          return (
                            <button
                              key={p.id}
                              onClick={() => handleProviderChange(p.id)}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-left cursor-pointer transition-colors duration-150"
                              style={{
                                backgroundColor: active ? accentFaded : 'transparent',
                                color: active ? accent : text,
                              }}
                            >
                              <span
                                className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                                style={{ backgroundColor: p.id === 'openai' ? '#10A37F' : accent + '99' }}
                              >
                                {p.letter}
                              </span>
                              <span className="truncate">{p.name}</span>
                              {active && <Check size={13} className="ml-auto flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Model selector */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: muted }}>
                  Model
                </label>
                <div ref={modelRef} className="relative">
                  <button
                    onClick={() => {
                      setModelOpen(!modelOpen);
                      setProviderOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-medium cursor-pointer"
                    style={inputStyle}
                  >
                    <span className="flex items-center gap-2.5">
                      <Zap size={14} style={{ color: accent, opacity: 0.7 }} />
                      <span className="truncate">{config.modelId}</span>
                    </span>
                    <ChevronDown
                      size={14}
                      style={{
                        color: muted,
                        transform: modelOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>
                  <AnimatePresence>
                    {modelOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease }}
                        className="absolute z-50 top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar"
                        style={{
                          backgroundColor: card,
                          border: bdr('1.5px', border),
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
                        }}
                      >
                        {currentModels.map((m) => {
                          const active = m === config.modelId;
                          return (
                            <button
                              key={m}
                              onClick={() => {
                                updateConfig({ modelId: m });
                                setModelOpen(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-left cursor-pointer transition-colors duration-150"
                              style={{
                                backgroundColor: active ? accentFaded : 'transparent',
                                color: active ? accent : text,
                              }}
                            >
                              <Zap
                                size={13}
                                style={{ color: active ? accent : muted, opacity: 0.7, flexShrink: 0 }}
                              />
                              <span className="truncate">{m}</span>
                              {active && <Check size={13} className="ml-auto flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: muted }}>
                  <Key size={11} />
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => updateConfig({ apiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full px-3.5 py-2.5 pr-10 text-[13px] font-mono"
                    style={inputStyle}
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-colors duration-150"
                    style={{ color: muted }}
                  >
                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {maskedKey && !showApiKey && (
                  <p className="text-[11px] mt-1.5 font-mono" style={{ color: muted }}>
                    {maskedKey}
                  </p>
                )}
              </div>

              {/* Base URL */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: muted }}>
                  <Link size={11} />
                  Base URL
                </label>
                <input
                  type="text"
                  value={config.baseUrl}
                  onChange={(e) => updateConfig({ baseUrl: e.target.value })}
                  placeholder="https://api.example.com/v1"
                  className="w-full px-3.5 py-2.5 text-[13px] font-mono"
                  style={inputStyle}
                />
              </div>
            </div>
          </SectionCard>

          {/* ============ ADVANCED SETTINGS ============ */}
          <SectionCard title="Advanced" icon={Sliders} delay={0.15}>
            <div className="space-y-5">
              {/* Temperature slider */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: muted }}>
                    <Thermometer size={11} />
                    Temperature
                  </label>
                  <span
                    className="text-[12px] font-bold px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: accentSoft, color: accent }}
                  >
                    {config.temperature.toFixed(1)}
                  </span>
                </div>
                <div className="relative h-2 rounded-full" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                  {/* Fill track */}
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-100"
                    style={{ width: `${tempPercent}%`, backgroundColor: accent }}
                  />
                  {/* Native range input (transparent, overlaid) */}
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={config.temperature}
                    onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ margin: 0 }}
                  />
                  {/* Custom thumb */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all duration-100 pointer-events-none"
                    style={{
                      left: `calc(${tempPercent}% - 8px)`,
                      backgroundColor: card,
                      borderColor: accent,
                      boxShadow: `0 1px 4px rgba(0,0,0,0.15), 0 0 0 3px ${accent}20`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px]" style={{ color: muted }}>Precise (0)</span>
                  <span className="text-[10px]" style={{ color: muted }}>Creative (2)</span>
                </div>
              </div>

              {/* Max Output Tokens */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: muted }}>
                  <FileText size={11} />
                  Max Output Tokens
                </label>
                <input
                  type="number"
                  value={config.maxOutput}
                  onChange={(e) => updateConfig({ maxOutput: Math.max(1, parseInt(e.target.value) || 0) })}
                  min={1}
                  max={100000}
                  className="w-full px-3.5 py-2.5 text-[13px] font-mono"
                  style={inputStyle}
                />
                <p className="text-[11px] mt-1.5" style={{ color: muted }}>
                  Maximum number of tokens the model can generate per response.
                </p>
              </div>

              {/* Context Window */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: muted }}>
                  <Hash size={11} />
                  Context Window
                </label>
                <input
                  type="number"
                  value={config.contextWindow}
                  onChange={(e) => updateConfig({ contextWindow: Math.max(1, parseInt(e.target.value) || 0) })}
                  min={1}
                  max={2000000}
                  className="w-full px-3.5 py-2.5 text-[13px] font-mono"
                  style={inputStyle}
                />
                <p className="text-[11px] mt-1.5" style={{ color: muted }}>
                  Maximum context size sent to the model. Larger values use more tokens.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* ============ ABOUT ============ */}
          <SectionCard title="About" icon={Info} delay={0.2}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium" style={{ color: text }}>Version</span>
                <span
                  className="text-[12px] font-bold px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: accentSoft, color: accent }}
                >
                  0.1.0
                </span>
              </div>
              <div
                className="h-px"
                style={{ backgroundColor: border }}
              />
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium" style={{ color: text }}>Build</span>
                <span className="text-[12px]" style={{ color: muted }}>Electron + Next.js 16</span>
              </div>
              <div
                className="h-px"
                style={{ backgroundColor: border }}
              />
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium" style={{ color: text }}>Runtime</span>
                <span className="text-[12px]" style={{ color: muted }}>Bun</span>
              </div>
              <div
                className="h-px"
                style={{ backgroundColor: border }}
              />
              <div>
                <span className="text-[13px] font-medium block mb-1" style={{ color: text }}>Credits</span>
                <p className="text-[12px] leading-relaxed" style={{ color: muted }}>
                  Acute Agent is built with TypeScript, Tailwind CSS, Framer Motion, Zustand, and Prisma. Powered by cutting-edge AI models.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </motion.div>
  );
}
