"use client";

import { InfoTooltip } from "@/components/shared/InfoTooltip";
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
    <div className="pb-8 border-b border-brand-border/60">
      {/* Total Revenue — left-aligned, contextual output */}
      <p className="text-sm text-brand-muted mb-1">
        Estimated annual revenue{companyName ? ` for ${companyName}` : ""}
      </p>
      <p className="text-4xl lg:text-5xl font-bold text-brand-revenue tracking-tight tabular-nums">
        {formatEur(results.totalCPO)}
      </p>
      <p className="text-sm text-brand-muted mt-1.5">
        {formatEur(results.perCharger)} per charger / year
      </p>

      {/* Revenue Streams */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-brand-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
            E-Credits
            <InfoTooltip
              content="E-Credit revenue is calculated based on your charging volume, renewable energy contribution, and current carbon credit market rates."
              disclaimer="Rates reflect current EU carbon credit pricing and may vary by region."
            />
          </p>
          <p className="text-xl font-semibold text-brand-ecredit tabular-nums">
            {formatEur(results.ecreditCPO)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-brand-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
            Grid Flexibility
            <InfoTooltip
              content="Grid flexibility revenue is derived from your charger capacity, flexible availability, and live market prices for frequency regulation services."
              disclaimer="Market prices vary by month and country, based on real auction data from Nordic and European energy markets."
            />
          </p>
          <p className="text-xl font-semibold text-brand-revenue tabular-nums">
            {formatEur(results.flexCPO)}
          </p>
        </div>
      </div>

      {/* Revenue Split Bar */}
      <div className="mt-4">
        <div className="flex h-1.5 rounded-full overflow-hidden bg-brand-subtle">
          <div
            className="bg-brand-ecredit transition-all duration-500 ease-out"
            style={{ width: `${ecreditPct}%` }}
          />
          <div
            className="bg-brand-revenue transition-all duration-500 ease-out"
            style={{ width: `${flexPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-brand-muted">
          <span>E-Credits {ecreditPct}%</span>
          <span>Flexibility {flexPct}%</span>
        </div>
      </div>
    </div>
  );
}
