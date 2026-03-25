"use client";

import { formatEur } from "@/lib/utils/formatter";
import type { CalculationResult } from "@/lib/calculator/types";

interface ResultsHeroProps {
  results: CalculationResult;
  companyName: string;
}

export function ResultsHero({ results, companyName }: ResultsHeroProps) {
  const ecreditPct =
    results.totalCPO > 0
      ? Math.round((results.ecreditCPO / results.totalCPO) * 100)
      : 0;
  const flexPct = 100 - ecreditPct;

  return (
    <div className="pb-8 border-b border-brand-border">
      <p className="text-sm text-brand-muted mb-1">
        Estimated annual revenue{companyName ? ` for ${companyName}` : ""}
      </p>
      <p className="text-4xl lg:text-5xl font-bold text-brand-ecredit tracking-tight tabular-nums">
        {formatEur(results.totalCPO)}
      </p>
      <p className="text-sm text-brand-muted mt-1.5">
        {formatEur(results.perCharger)} per charger / year &middot; {results.totalChargers.toLocaleString()} total chargers
      </p>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-brand-muted uppercase tracking-wider mb-1">
            E-Credits
          </p>
          <p className="text-xl font-semibold text-brand-ecredit tabular-nums">
            {formatEur(results.ecreditCPO)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-brand-muted uppercase tracking-wider mb-1">
            Grid Flexibility
          </p>
          <p className="text-xl font-semibold text-brand-warm tabular-nums">
            {formatEur(results.flexCPO)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex h-1.5 rounded-full overflow-hidden bg-brand-surface">
          <div className="bg-brand-ecredit transition-all duration-500 ease-out" style={{ width: `${ecreditPct}%` }} />
          <div className="bg-brand-warm transition-all duration-500 ease-out" style={{ width: `${flexPct}%` }} />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-brand-muted">
          <span>E-Credits {ecreditPct}%</span>
          <span>Flexibility {flexPct}%</span>
        </div>
      </div>
    </div>
  );
}
