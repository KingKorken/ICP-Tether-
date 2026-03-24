"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { calculateRevenue } from "@/lib/calculator/engine";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { ResultsHero } from "@/components/calculator/ResultsHero";
import { SeasonalChart } from "@/components/calculator/SeasonalChart";
import { CumulativeTimeline } from "@/components/calculator/CumulativeTimeline";
import { LossCounter } from "@/components/calculator/LossCounter";
import { MethodologyPanel } from "@/components/calculator/MethodologyPanel";
import { startBatcher, stopBatcher, trackEvent } from "@/lib/tracking/tracker";
import { EVENTS } from "@/lib/tracking/events";
import type { SimulatorState, CalculationResult } from "@/lib/calculator/types";

interface SimulatorClientProps {
  accessToken: string;
  tokenId: string;
  leadId: string;
  initialState: SimulatorState;
  hasExistingSnapshot: boolean;
  isDemoMode?: boolean;
}

type LoadingState = "loading" | "ready" | "error";

export function SimulatorClient({
  accessToken,
  tokenId,
  leadId,
  initialState,
  hasExistingSnapshot,
  isDemoMode = false,
}: SimulatorClientProps) {
  const [inputs, setInputs] = useState<SimulatorState>(initialState);
  const [loadingState, setLoadingState] = useState<LoadingState>("ready");
  const [calculatedResults, setCalculatedResults] =
    useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const saveVersionRef = useRef(0);
  const sessionIdRef = useRef<string>("");

  // Compute start month once at mount
  const [startMonth] = useState(() => new Date().getMonth());

  // Suppress unused variable warnings for props needed by the component interface
  void accessToken;
  void leadId;
  void hasExistingSnapshot;

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

    return () => {
      stopBatcher();
    };
  }, [tokenId]);

  // Handle input changes — only updates local state, no calculation or save
  const handleInputChange = useCallback(
    (
      field: keyof SimulatorState,
      value: SimulatorState[keyof SimulatorState]
    ) => {
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

        return newState;
      });
    },
    []
  );

  // Calculate button handler — runs calculation with randomized delay, then saves
  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);

    // Randomized delay: 1–3 seconds
    const delay = Math.random() * 2000 + 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Run the actual calculation
    const results = calculateRevenue(inputs, startMonth);
    setCalculatedResults(results);
    setIsCalculating(false);

    // Save snapshot to database (skip in demo mode)
    if (!isDemoMode) {
      saveVersionRef.current += 1;
      const version = saveVersionRef.current;

      try {
        await fetch("/api/snapshots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token_id: tokenId,
            session_id: sessionIdRef.current || undefined,
            input_state: inputs,
            output_results: results,
            client_version: version,
          }),
        });

        // Track the snapshot saved event
        trackEvent({
          type: EVENTS.SNAPSHOT_SAVED,
          payload: { snapshot_id: crypto.randomUUID() },
        });
      } catch {
        // Silent failure — don't break UX for analytics
      }
    }
  }, [inputs, startMonth, isDemoMode, tokenId]);

  if (loadingState === "loading") {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div>
          <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center mb-3 animate-pulse">
            <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-brand-muted text-sm">
            Loading your simulator...
          </p>
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
            <span className="text-lg font-semibold text-white tracking-tight">
              Tether
            </span>
            <span className="text-brand-muted text-xs font-medium tracking-wide uppercase">
              Revenue Simulator
            </span>
          </div>
          <div className="flex items-center gap-3">
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
            {/* Calculating overlay */}
            {isCalculating && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-brand-light/80 backdrop-blur-sm rounded-lg">
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto mb-3 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-base font-semibold text-brand-text">
                    Recalculating...
                  </p>
                  <p className="text-sm text-brand-muted mt-1">
                    Analyzing market conditions
                  </p>
                </div>
              </div>
            )}

            {/* Empty placeholder or results */}
            {calculatedResults ? (
              <>
                <ResultsHero
                  results={calculatedResults}
                  companyName={inputs.company}
                  horizonMonths={calculatedResults.totalMonths}
                />

                <div className="mt-10 space-y-10">
                  <SeasonalChart data={calculatedResults.monthly} />
                  <CumulativeTimeline
                    data={calculatedResults.cumulative}
                    totalMonths={calculatedResults.totalMonths}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 mb-6 rounded-full bg-brand-subtle flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-brand-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                    />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-brand-text mb-2">
                  Revenue Projections
                </p>
                <p className="text-sm text-brand-muted max-w-sm">
                  Configure your fleet inputs and click{" "}
                  <span className="font-medium text-brand-primary">
                    Calculate Revenue
                  </span>{" "}
                  to see your revenue projections.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Loss Counter + Methodology — only show after calculation */}
        {calculatedResults && (
          <>
            <div className="mt-16">
              <LossCounter
                cumulativeTotal={
                  calculatedResults.cumulative[
                    calculatedResults.cumulative.length - 1
                  ]?.cumulativeCombined ?? 0
                }
                totalMonths={calculatedResults.totalMonths}
                companyName={inputs.company}
              />
            </div>

            <div className="mt-6 mb-16">
              <MethodologyPanel />
            </div>
          </>
        )}

        {/* Bottom spacer when no results */}
        {!calculatedResults && <div className="mb-16" />}
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-border/60 py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-brand-muted">
          <span>&copy; {new Date().getFullYear()} Tether EV</span>
          <div className="flex items-center gap-4">
            <a
              href="/privacy"
              className="hover:text-brand-text transition-colors"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="hover:text-brand-text transition-colors"
            >
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
