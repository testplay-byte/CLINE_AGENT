'use client';

import { useEffect, useRef } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { useThemeStyles } from '@/lib/use-theme-styles';
import { useDashboardStore } from '@/lib/dashboard-store';
import { useProjectChatStore } from '@/lib/project-chat-store';
import { DashboardPage } from '@/components/dashboard';
import OnboardingHeader from '@/components/onboarding/Header';
import OnboardingFooter from '@/components/onboarding/Footer';
import WelcomeScreen from '@/components/onboarding/WelcomeScreen';
import PickFlavorScreen from '@/components/onboarding/PickFlavorScreen';
import NeedBrainScreen from '@/components/onboarding/NeedBrainScreen';
import PlugBrainScreen from '@/components/onboarding/PlugBrainScreen';
import AllSetScreen from '@/components/onboarding/AllSetScreen';
import { AnimatePresence, motion } from 'framer-motion';

function OnboardingFlow() {
  const step = useOnboardingStore((s) => s.step);
  const s = useThemeStyles();

  const screenVariants = {
    enter: { opacity: 0, y: 12 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  };

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundColor: s.bg,
        color: s.text,
        transition: 'background-color 0.35s ease, color 0.35s ease',
      }}
    >
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.025,
          backgroundImage: `radial-gradient(circle at 1px 1px, ${s.dotColor} 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute -top-32 -right-32 w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: s.accent, opacity: 0.06 }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: s.accent, opacity: 0.03 }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <OnboardingHeader />

        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={screenVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {step === 0 && <WelcomeScreen />}
              {step === 1 && <PickFlavorScreen />}
              {step === 2 && <NeedBrainScreen />}
              {step === 3 && <PlugBrainScreen />}
              {step === 4 && <AllSetScreen />}
            </motion.div>
          </AnimatePresence>
        </div>

        <OnboardingFooter />
      </div>
    </div>
  );
}

export default function Page() {
  const completed = useOnboardingStore((s) => s.completed);
  const setCompleted = useOnboardingStore((s) => s.setCompleted);
  const hydrated = useRef(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    // Check if onboarding was previously completed
    const wasCompleted = localStorage.getItem('acute-agent-onboarding-done');
    if (wasCompleted === 'true') {
      // Restore config and mark completed
      const raw = localStorage.getItem('acute-agent-config');
      if (raw) {
        try {
          const config = JSON.parse(raw);
          // Sync to onboarding store
          const store = useOnboardingStore.getState();
          if (config.themeId) store.setTheme(config.themeId);
          if (config.providerId) store.setProvider(config.providerId);
          if (config.baseUrl) store.setBaseUrl(config.baseUrl);
          if (config.apiKey) store.setApiKey(config.apiKey);
          if (config.modelId && config.modelId !== 'demo') store.setModelId(config.modelId);

          // Sync to dashboard store
          const dash = useDashboardStore.getState();
          dash.setTheme(config.themeId || 'nova');
          if (config.isDark && !dash.isDark) dash.toggleDark();

          // Sync to project chat store
          const chat = useProjectChatStore.getState();
          if (config.modelId && config.modelId !== 'demo') {
            chat.setSelectedModelId(config.modelId);
          }
        } catch (e) {
          console.warn('Failed to parse stored config:', e);
        }
      }
      setCompleted();
    }
  }, [setCompleted]);

  if (!completed) {
    return <OnboardingFlow />;
  }

  return <DashboardPage />;
}
