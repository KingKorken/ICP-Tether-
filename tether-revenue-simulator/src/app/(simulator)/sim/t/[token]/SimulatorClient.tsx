"use client";

import { useState, useMemo, useDeferredValue, useEffect, useCallback, useRef } from "react";
import { calculateRevenue } from "@/lib/calculator/engine";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { ResultsHero } from "@/components/calculator/ResultsHero";
import { SeasonalChart } from "@/components/calculator/SeasonalChart";
import { CumulativeTimeline } from "@/components/calculator/CumulativeTimeline";
import { LossCounter } from "@/components/calculator/LossCounter";
import { MethodologyPanel } from "@/components/calculator/MethodologyPanel";
import { startBatcher, stopBatcher, trackEvent } from "@/lib/tracking/tracker";
import { EVENTS } from "@/lib/tracking/events";
import type { SimulatorState } from "@/lib/calculator/types";

interface SimulatorClientProps {
  accessToken: string;
  tokenId: string;
  leadId: string;
  initialState: SimulatorState;
  hasExistingSnapshot: boolean;
}

type LoadingState = "loading" | "ready" | "error";

export function SimulatorClient({
  accessToken,
  tokenId,
  leadId,
  initialState,
  hasExistingSnapshot,
}: SimulatorClientProps) {
  const [inputs, setInputs] = useState<SimulatorState>(initialState);
  const [loadingState, setLoadingState] = useState<LoadingState>(
    hasExistingSnapshot ? "ready" : "ready"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const saveVersionRef = useRef(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string>("");

  // Compute start month once at mount
  const [startMonth] = useState(() => new Date().getMonth());

  // Use deferred value for smooth slider interaction
  const deferredInputs = useDeferredValue(inputs);
  const results = useMemo(
    () => calculateRevenue(deferredInputs, startMonth),
    [deferredInputs, startMonth]
  );

  // Initialize session and event batcher
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await fetch("/api/events/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            events: [
              {
                event_type: EVENTS.SESSION_STARTED,
                payload: {
                  referrer: document.referrer || "",
                  device_type: getDeviceType(),
                },
                client_sequence: 0,
                client_timestamp: new Date().toISOString(),
              },
            ],
            session_id: crypto.randomUUID(),
            token_id: tokenId,
          }),
        });

        if (res.ok) {
          sessionIdRef.current = crypto.randomUUID();
          startBatcher({
            tokenId,
            sessionId: sessionIdRef.current,
          });
        }
      } catch {
        // Event tracking failure is silent
      }
    };

    initSession();
    setLoadingState("ready");

    return () => {
      stopBatcher();
    };
  }, [tokenId]);

  // Debounced save (2 second delay)
  const debouncedSave = useCallback(
    (state: SimulatorState) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        saveVersionRef.current += 1;
        const version = saveVersionRef.current;
        setIsSaving(true);

        try {
          const result = calculateRevenue(state);
          await fetch("/api/events/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              events: [
                {
                  event_type: EVENTS.SNAPSHOT_SAVED,
                  payload: { snapshot_id: crypto.randomUUID() },
                  client_sequence: version,
                  client_timestamp: new Date().toISOString(),
                },
              ],
              session_id: sessionIdRef.current || crypto.randomUUID(),
              token_id: tokenId,
            }),
          });

          void result;
        } catch {
          // Silent failure
        } finally {
          setIsSaving(false);
        }
      }, 2000);
    },
    [tokenId]
  );

  // Calculate button — shows overlay animation, then saves
  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    const delay = Math.random() * 2000 + 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
    setIsCalculating(false);
    debouncedSave(inputs);
  }, [inputs, debouncedSave]);

  // Handle input changes
  const handleInputChange = useCallback(
    (field: keyof SimulatorState, value: SimulatorState[keyof SimulatorState]) => {
      setInputs((prev) => {
        const oldValue = String(prev[field]);
        const newState = { ...prev, [field]: value };

        trackEvent({
          type: EVENTS.INPUT_CHANGED,
          payload: {
            field: String(field),
            old_value: oldValue,
            new_value: String(value),
          },
        });

        debouncedSave(newState);

        return newState;
      });
    },
    [debouncedSave]
  );

  // Flush pending saves on unmount or navigation
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (loadingState === "loading") {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div>
          <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center mb-3 animate-pulse">
            <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-brand-muted text-sm">Loading your simulator...</p>
        </div>
      </div>
    );
  }

  if (loadingState === "error") {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="max-w-md">
          <p className="text-brand-warm text-base font-semibold mb-1">
            Something went wrong
          </p>
          <p className="text-brand-muted text-sm">
            We couldn&apos;t load your saved data. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Header */}
      <header className="bg-brand-dark py-3 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-semibold text-white tracking-tight">Tether</span>
            <span className="text-brand-muted text-xs font-medium tracking-wide uppercase">Revenue Simulator</span>
          </div>
          <div className="flex items-center gap-3">
            {isSaving && (
              <span className="text-xs text-brand-muted flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-brand-ecredit rounded-full animate-pulse" />
                Saving
              </span>
            )}
            {inputs.company && (
              <span className="text-sm text-brand-muted font-medium">
                {inputs.company}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6">
        {/* Configuration + Results — side by side */}
        <div className="grid lg:grid-cols-12 gap-6 pt-8">
          {/* Left Column: Form (sticky) */}
          <div className="lg:col-span-4">
            <CalculatorForm
              state={inputs}
              onChange={handleInputChange}
              onCalculate={handleCalculate}
              isCalculating={isCalculating}
            />
          </div>

          {/* Right Column: Results output + Charts */}
          <div className="lg:col-span-8 relative">
            {isCalculating && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-brand-light/80 backdrop-blur-sm rounded-lg">
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto mb-3 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-base font-semibold text-brand-text">Recalculating...</p>
                  <p className="text-sm text-brand-muted mt-1">Analyzing market conditions</p>
                </div>
              </div>
            )}
            <ResultsHero results={results} companyName={inputs.company} horizonMonths={inputs.horizonMonths} />

            <div className="mt-10 space-y-10">
              <SeasonalChart data={results.monthly} />
              <CumulativeTimeline data={results.cumulative} totalMonths={results.totalMonths} />
            </div>
          </div>
        </div>

        {/* Loss Counter — generous section break */}
        <div className="mt-16">
          <LossCounter
            cumulativeTotal={
              results.cumulative[results.cumulative.length - 1]?.cumulativeCombined ?? 0
            }
            totalMonths={results.totalMonths}
            companyName={inputs.company}
          />
        </div>

        {/* Methodology / See the Math */}
        <div className="mt-6 mb-16">
          <MethodologyPanel />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-border/60 py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-brand-muted">
          <span>&copy; {new Date().getFullYear()} Tether EV</span>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:text-brand-text transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-brand-text transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function getDeviceType(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}
