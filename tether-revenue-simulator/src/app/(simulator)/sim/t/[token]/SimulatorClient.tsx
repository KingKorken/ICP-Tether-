"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { calculateMultiRevenue } from "@/lib/calculator/engine";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { ResultsHero } from "@/components/calculator/ResultsHero";
import { SeasonalChart } from "@/components/calculator/SeasonalChart";
import { CumulativeTimeline } from "@/components/calculator/CumulativeTimeline";
import { LossCounter } from "@/components/calculator/LossCounter";
import { startBatcher, stopBatcher, trackEvent } from "@/lib/tracking/tracker";
import { EVENTS } from "@/lib/tracking/events";
import type { SimulatorState, ChargerGroup } from "@/lib/calculator/types";

/* MethodologyPanel — hidden (Black Box). Code preserved:
   import { MethodologyPanel } from "@/components/calculator/MethodologyPanel";
*/
/* ContactSalesCTA — hidden. Code preserved:
   import { ContactSalesCTA } from "@/components/calculator/ContactSalesCTA";
*/

interface SimulatorClientProps {
  accessToken: string;
  tokenId: string;
  leadId: string;
  initialState: SimulatorState;
  hasExistingSnapshot: boolean;
}

type CalcState = "idle" | "calculating" | "done";

export function SimulatorClient({
  accessToken,
  tokenId,
  leadId,
  initialState,
  hasExistingSnapshot,
}: SimulatorClientProps) {
  const [configs, setConfigs] = useState<ChargerGroup[]>([{
    id: 0,
    chargers: initialState.chargers,
    powerMW: initialState.powerMW,
    utilization: initialState.utilization,
    flexPotential: initialState.flexPotential,
    type: initialState.type,
    country: initialState.country,
  }]);

  // Timeframe is a VIEW-LAYER control — changes slicing instantly, no recalc needed
  const [timeframe, setTimeframe] = useState(initialState.horizonMonths as 3 | 6 | 12);
  const [companyName] = useState(initialState.company);
  const [calcState, setCalcState] = useState<CalcState>(hasExistingSnapshot ? "done" : "idle");
  const sessionIdRef = useRef<string>("");

  // Committed configs (only updates on Calculate press)
  const [committedConfigs, setCommittedConfigs] = useState<ChargerGroup[] | null>(
    hasExistingSnapshot ? [{
      id: 0, chargers: initialState.chargers, powerMW: initialState.powerMW,
      utilization: initialState.utilization, flexPotential: initialState.flexPotential,
      type: initialState.type, country: initialState.country,
    }] : null
  );

  // Engine always returns 12 months
  const fullResults = useMemo(() => {
    if (!committedConfigs || committedConfigs.length === 0) return null;
    return calculateMultiRevenue(committedConfigs);
  }, [committedConfigs]);

  // Slice for the current timeframe — this is what makes the zoom instant
  const visibleMonthly = useMemo(
    () => fullResults?.monthly.slice(-timeframe) ?? [],
    [fullResults, timeframe]
  );
  const visibleCumulative = useMemo(() => {
    if (!fullResults) return [];
    // Re-accumulate from the sliced window so cumulative starts at 0
    const sliced = fullResults.monthly.slice(-timeframe);
    let run = 0;
    let runEc = 0;
    return sliced.map((m) => {
      run += m.combined;
      runEc += m.ecredits;
      return { month: m.month, cumulativeCombined: run, cumulativeEcredits: runEc };
    });
  }, [fullResults, timeframe]);

  void accessToken;
  void leadId;

  // Session init
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/events/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            events: [{ event_type: EVENTS.SESSION_STARTED, payload: { referrer: document.referrer || "", device_type: getDeviceType() }, client_sequence: 0, client_timestamp: new Date().toISOString() }],
            session_id: crypto.randomUUID(), token_id: tokenId,
          }),
        });
        if (res.ok) { sessionIdRef.current = crypto.randomUUID(); startBatcher({ tokenId, sessionId: sessionIdRef.current }); }
      } catch { /* Silent */ }
    })();
    return () => { stopBatcher(); };
  }, [tokenId]);

  // Calculate with 1-3s delay
  const handleCalculate = useCallback(() => {
    if (configs.length === 0) return;
    setCalcState("calculating");
    setTimeout(() => {
      setCommittedConfigs([...configs]);
      setCalcState("done");
      try { trackEvent({ type: EVENTS.SNAPSHOT_SAVED, payload: { snapshot_id: crypto.randomUUID() } }); } catch { /* Silent */ }
    }, 1000 + Math.random() * 2000);
  }, [configs]);

  return (
    <div className="min-h-screen bg-brand-dark">
      <header className="bg-brand-primary-light/50 border-b border-brand-border py-3 px-6 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-semibold text-white tracking-tight">Tether</span>
            <span className="text-brand-muted text-xs font-medium tracking-wide uppercase">Revenue Simulator</span>
          </div>
          <div className="flex items-center gap-3">
            {calcState === "calculating" && (
              <span className="text-xs text-brand-ecredit flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-brand-ecredit rounded-full animate-pulse" />
                Recalculating&hellip;
              </span>
            )}
            {companyName && <span className="text-sm text-brand-muted font-medium">{companyName}</span>}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-6 pt-8">
          <div className="lg:col-span-4">
            <CalculatorForm
              configs={configs}
              horizonMonths={timeframe}
              onConfigsChange={setConfigs}
              onHorizonChange={(m) => setTimeframe(m as 3 | 6 | 12)}
              onCalculate={handleCalculate}
              isCalculating={calcState === "calculating"}
            />
          </div>

          <div className={`lg:col-span-8 transition-all duration-300 ${calcState === "calculating" ? "opacity-40 blur-sm" : ""}`}>
            {fullResults ? (
              <>
                <ResultsHero results={fullResults} companyName={companyName} />
                <div className="mt-10 space-y-10">
                  <SeasonalChart data={visibleMonthly} />
                  <CumulativeTimeline data={visibleCumulative} totalMonths={timeframe} />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <p className="text-brand-muted text-lg mb-2">Configure your fleet and hit Calculate</p>
                  <p className="text-brand-muted/60 text-sm">Revenue estimates powered by Tether</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {fullResults && (
          <div className="mt-16">
            <LossCounter
              cumulativeTotal={visibleCumulative[visibleCumulative.length - 1]?.cumulativeCombined ?? 0}
              totalMonths={timeframe}
              companyName={companyName}
            />
          </div>
        )}
        <div className="mb-16" />
      </main>

      <footer className="border-t border-brand-border py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-brand-muted">
          <span>&copy; {new Date().getFullYear()} Tether EV</span>
          <span className="text-brand-muted/40">Powered by Tether</span>
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
