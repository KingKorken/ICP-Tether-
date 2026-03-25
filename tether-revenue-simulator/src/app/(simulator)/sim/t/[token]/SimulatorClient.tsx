"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { calculateRevenue } from "@/lib/calculator/engine";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { ResultsHero } from "@/components/calculator/ResultsHero";
import { SeasonalChart } from "@/components/calculator/SeasonalChart";
import { CumulativeTimeline } from "@/components/calculator/CumulativeTimeline";
import { LossCounter } from "@/components/calculator/LossCounter";
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
type CalcState = "idle" | "calculating" | "done";

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
  const [calcState, setCalcState] = useState<CalcState>(
    hasExistingSnapshot ? "done" : "idle"
  );
  const sessionIdRef = useRef<string>("");

  // Results only update when Calculate is pressed
  const [committedInputs, setCommittedInputs] = useState<SimulatorState | null>(
    hasExistingSnapshot ? initialState : null
  );

  const results = useMemo(
    () => committedInputs ? calculateRevenue(committedInputs) : null,
    [committedInputs]
  );

  // Suppress unused variable warnings for preserved code references
  void accessToken;
  void leadId;

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

  // Handle input changes (no auto-calculation — only updates local state)
  const handleInputChange = useCallback(
    (field: keyof SimulatorState, value: SimulatorState[keyof SimulatorState]) => {
      setInputs((prev) => {
        trackEvent({
          type: EVENTS.INPUT_CHANGED,
          payload: {
            field: String(field),
            old_value: String(prev[field]),
            new_value: String(value),
          },
        });
        return { ...prev, [field]: value };
      });
    },
    []
  );

  // Calculate button handler with loading delay (1-3 seconds)
  const handleCalculate = useCallback(() => {
    setCalcState("calculating");

    const delay = 1000 + Math.random() * 2000;

    setTimeout(async () => {
      setCommittedInputs({ ...inputs });
      setCalcState("done");

      // Trigger data save event on calculate button click
      try {
        const result = calculateRevenue(inputs);
        await fetch("/api/events/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            events: [
              {
                event_type: EVENTS.SNAPSHOT_SAVED,
                payload: {
                  snapshot_id: crypto.randomUUID(),
                  total_cpo: result.totalCPO,
                  ecredit_cpo: result.ecreditCPO,
                  flex_cpo: result.flexCPO,
                },
                client_sequence: Date.now(),
                client_timestamp: new Date().toISOString(),
              },
            ],
            session_id: sessionIdRef.current || crypto.randomUUID(),
            token_id: tokenId,
          }),
        });
      } catch {
        // Silent failure
      }
    }, delay);
  }, [inputs, tokenId]);

  if (loadingState === "loading") {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div>
          <div className="w-10 h-10 bg-brand-ecredit/10 rounded-full flex items-center justify-center mb-3 animate-pulse">
            <div className="w-5 h-5 border-2 border-brand-ecredit border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-brand-muted text-sm">Loading your simulator...</p>
        </div>
      </div>
    );
  }

  if (loadingState === "error") {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
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
    <div className="min-h-screen bg-brand-dark">
      {/* Header */}
      <header className="bg-brand-primary-light/50 border-b border-brand-border py-3 px-6 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-semibold text-white tracking-tight">Tether</span>
            <span className="text-brand-muted text-xs font-medium tracking-wide uppercase">Revenue Simulator</span>
          </div>
          <div className="flex items-center gap-3">
            {calcState === "calculating" && (
              <span className="text-xs text-brand-ecredit flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-brand-ecredit rounded-full animate-pulse" />
                Recalculating...
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
        <div className="grid lg:grid-cols-12 gap-6 pt-8">
          {/* Left Column: Form (sticky) */}
          <div className="lg:col-span-4">
            <CalculatorForm
              state={inputs}
              onChange={handleInputChange}
              onCalculate={handleCalculate}
              isCalculating={calcState === "calculating"}
            />
          </div>

          {/* Right Column: Results output + Charts */}
          <div className={`lg:col-span-8 transition-all duration-300 ${calcState === "calculating" ? "opacity-40 blur-sm" : ""}`}>
            {results ? (
              <>
                <ResultsHero results={results} companyName={inputs.company} />
                <div className="mt-10 space-y-10">
                  <SeasonalChart data={results.monthly} />
                  <CumulativeTimeline data={results.cumulative} totalMonths={results.totalMonths} />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <p className="text-brand-muted text-lg mb-2">Configure your fleet and hit Calculate</p>
                  <p className="text-brand-muted/60 text-sm">Results based on historical ENTSO-E market data</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loss Counter */}
        {results && (
          <div className="mt-16">
            <LossCounter
              cumulativeTotal={
                results.cumulative[results.cumulative.length - 1]?.cumulativeCombined ?? 0
              }
              totalMonths={results.totalMonths}
              companyName={inputs.company}
            />
          </div>
        )}

        {/* Contact Sales CTA — hidden but code preserved for re-enablement.
            To restore, uncomment the import and JSX below:

            import { ContactSalesCTA } from "@/components/calculator/ContactSalesCTA";

            <div className="mt-6 mb-16">
              <ContactSalesCTA tokenId={tokenId} leadId={leadId} accessToken={accessToken} />
            </div>
        */}
        <div className="mb-16" />
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-border py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-brand-muted">
          <span>&copy; {new Date().getFullYear()} Tether EV</span>
          <span className="text-brand-muted/40">Historical data from ENTSO-E Transparency Platform</span>
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
