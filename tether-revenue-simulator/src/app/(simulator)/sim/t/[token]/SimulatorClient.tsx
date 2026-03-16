"use client";

import { useState, useMemo, useDeferredValue, useEffect, useCallback, useRef } from "react";
import { calculateRevenue } from "@/lib/calculator/engine";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { ResultsHero } from "@/components/calculator/ResultsHero";
import { SeasonalChart } from "@/components/calculator/SeasonalChart";
import { CumulativeTimeline } from "@/components/calculator/CumulativeTimeline";
import { LossCounter } from "@/components/calculator/LossCounter";
import { ContactSalesCTA } from "@/components/calculator/ContactSalesCTA";
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
  const saveVersionRef = useRef(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string>("");

  // Use deferred value for smooth slider interaction
  const deferredInputs = useDeferredValue(inputs);
  const results = useMemo(
    () => calculateRevenue(deferredInputs),
    [deferredInputs]
  );

  // Initialize session and event batcher
  useEffect(() => {
    const initSession = async () => {
      try {
        // Create a session
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
            // Use a temporary session ID — in production this would come from a session creation endpoint
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

          // Save snapshot
          // TODO: Add proper snapshot save endpoint
          void result; // Use variable to prevent lint warning
        } catch {
          // Silent failure
        } finally {
          setIsSaving(false);
        }
      }, 2000);
    },
    [tokenId]
  );

  // Handle input changes
  const handleInputChange = useCallback(
    (field: keyof SimulatorState, value: SimulatorState[keyof SimulatorState]) => {
      setInputs((prev) => {
        const oldValue = String(prev[field]);
        const newState = { ...prev, [field]: value };

        // Track the change
        trackEvent({
          type: EVENTS.INPUT_CHANGED,
          payload: {
            field: String(field),
            old_value: oldValue,
            new_value: String(value),
          },
        });

        // Trigger debounced save
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
        <div className="text-center">
          <div className="w-12 h-12 bg-brand-tether/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-6 h-6 border-2 border-brand-tether border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-brand-muted">Loading your simulator...</p>
        </div>
      </div>
    );
  }

  if (loadingState === "error") {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-brand-warm text-lg font-semibold mb-2">
            Something went wrong
          </p>
          <p className="text-brand-muted">
            We couldn&apos;t load your saved data. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Header */}
      <header className="bg-brand-dark text-white py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl font-bold">Tether</span>
            <span className="text-brand-muted text-sm">Revenue Simulator</span>
          </div>
          <div className="flex items-center gap-4">
            {isSaving && (
              <span className="text-xs text-brand-muted flex items-center gap-1.5">
                <div className="w-2 h-2 bg-brand-tether rounded-full animate-pulse" />
                Saving...
              </span>
            )}
            {inputs.company && (
              <span className="text-sm text-brand-secondary">
                {inputs.company}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Results Hero */}
        <ResultsHero results={results} companyName={inputs.company} />

        {/* Calculator Form + Charts Grid */}
        <div className="grid lg:grid-cols-12 gap-8 mt-8">
          {/* Left Column: Form */}
          <div className="lg:col-span-4">
            <CalculatorForm
              state={inputs}
              onChange={handleInputChange}
            />
          </div>

          {/* Right Column: Charts */}
          <div className="lg:col-span-8 space-y-8">
            <SeasonalChart data={results.monthly} />
            <CumulativeTimeline data={results.cumulative} totalMonths={results.totalMonths} />
          </div>
        </div>

        {/* Loss Counter */}
        <LossCounter
          cumulativeTotal={
            results.cumulative[results.cumulative.length - 1]?.cumulativeCombined ?? 0
          }
          totalMonths={results.totalMonths}
          companyName={inputs.company}
        />

        {/* Contact Sales CTA */}
        <ContactSalesCTA
          tokenId={tokenId}
          leadId={leadId}
          accessToken={accessToken}
        />
      </main>

      {/* Footer */}
      <footer className="bg-brand-dark py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-brand-muted">
          <span>&copy; {new Date().getFullYear()} Tether EV</span>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-white transition-colors">
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
