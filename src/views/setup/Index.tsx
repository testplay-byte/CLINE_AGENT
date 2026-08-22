import { useState } from 'react';
import { ProviderConnectForm } from '../../components/setup/ProviderConnectForm';
import { AccentPicker, ModeToggle } from '../../components/theme/ThemeProvider';
import { CheckIcon, SparklesIcon } from '../../components/icons';
import { GhostButton, PrimaryButton } from '../../components/ui/primitives';
import { useSettingsStore } from '../../stores/settings.store';
import { useUiStore } from '../../stores/ui.store';

const STEPS = ['Welcome', 'Connect', 'Finish'] as const;

export default function SetupView() {
  const [step, setStep] = useState(0);
  const [providerConnected, setProviderConnected] = useState(false);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const setActiveView = useUiStore((s) => s.setActiveView);

  function finish() {
    completeOnboarding();
    setActiveView('dashboard');
  }

  return (
    <div className="dot-grid flex h-full flex-col overflow-y-auto">
      <header className="flex shrink-0 items-center justify-between px-6 py-4">
        <span className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-accent text-accent-foreground shadow-bento-sm">
            <SparklesIcon size={14} />
          </span>
          <span className="text-[13px] font-bold tracking-tight text-foreground">ACUTE CODE</span>
        </span>
        <span className="chip-mono">
          STEP {step + 1} / {STEPS.length}
        </span>
      </header>

      <main className="mx-auto w-full max-w-2xl px-6 pb-10">
        <div
          key={step}
          className="animate-fade-in-up rounded-[22px] border-[1.5px] border-border bg-card p-6 shadow-soft md:p-8"
        >
          <div className="mb-6 flex items-center gap-1.5">
            {STEPS.map((label, i) => (
              <span key={label} className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${
                    i <= step ? 'bg-accent' : 'bg-border'
                  }`}
                />
                {i < STEPS.length - 1 ? <span className="h-1.5 w-1.5 rounded-full bg-border" /> : null}
              </span>
            ))}
          </div>

          {step === 0 ? (
            <div>
              <h1 className="text-[32px] font-black leading-[0.95] tracking-tightest text-foreground">
                Welcome to
                <br />
                <span className="text-accent">ACUTE CODE.</span>
              </h1>
              <p className="mt-2 text-[13px] font-medium text-muted-foreground">
                A local-first agent workspace. Make it yours — you can change this later in Settings.
              </p>

              <div className="mt-6">
                <p className="label-caps mb-2">Mode</p>
                <ModeToggle />
              </div>

              <div className="mt-5">
                <p className="label-caps mb-2">Accent</p>
                <AccentPicker />
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button
                  type="button"
                  onClick={finish}
                  className="text-[12px] font-semibold text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground"
                >
                  Skip for now
                </button>
                <PrimaryButton bento onClick={() => setStep(1)}>
                  Continue →
                </PrimaryButton>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <h1 className="text-[28px] font-black leading-[0.95] tracking-tightest text-foreground">
                Plug in your brain.
              </h1>
              <p className="mt-2 text-[13px] font-medium text-muted-foreground">
                Connect a provider and paste a key. Keys stay on this device — always.
              </p>

              <div className="mt-6">
                <ProviderConnectForm onConnected={() => setProviderConnected(true)} />
              </div>

              <p className="mt-4 rounded-xl border border-border bg-muted px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                Connection tests run straight from this window. In production the local sidecar proxies every call,
                so keys never leave your machine beyond provider requests.
              </p>

              <div className="mt-6 flex items-center justify-between">
                <GhostButton onClick={() => setStep(0)}>← Back</GhostButton>
                <div className="flex items-center gap-3">
                  {!providerConnected ? (
                    <span className="font-mono text-[10px] text-muted-foreground">optional · skip anytime</span>
                  ) : null}
                  <PrimaryButton bento onClick={() => setStep(2)}>
                    Continue →
                  </PrimaryButton>
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="py-4 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent text-accent-foreground shadow-bento animate-float">
                <CheckIcon size={26} strokeWidth={3} />
              </span>
              <h1 className="mt-5 text-[30px] font-black tracking-tightest text-foreground">You&apos;re all set.</h1>
              <p className="mx-auto mt-2 max-w-sm text-[13px] font-medium leading-relaxed text-muted-foreground">
                Your workspace is ready. Create a project, spin up agents, and put them to work — everything runs
                locally on this machine.
              </p>
              <div className="mt-7 flex justify-center">
                <PrimaryButton bento onClick={finish}>
                  Open dashboard →
                </PrimaryButton>
              </div>
            </div>
          ) : null}
        </div>

        <p className="mt-4 text-center font-mono text-[10px] text-muted-foreground">
          local-first · closed-source · keys stay on this device
        </p>
      </main>
    </div>
  );
}
