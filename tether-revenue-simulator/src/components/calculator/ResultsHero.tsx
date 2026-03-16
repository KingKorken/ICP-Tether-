"use client";

import { Card } from "@/components/shared/Card";
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
    <Card padding="lg" className="bg-gradient-to-br from-brand-primary to-brand-dark text-white">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {/* Total Revenue */}
        <div>
          <p className="text-brand-secondary text-sm font-medium mb-1">
            Estimated Annual Revenue
            {companyName ? ` for ${companyName}` : ""}
          </p>
          <p className="text-5xl lg:text-6xl font-bold tracking-tight tabular-nums">
            {formatEur(results.totalCPO)}
          </p>
          <p className="text-brand-secondary/80 text-sm mt-2">
            {formatEur(results.perCharger)} per charger / year
          </p>
        </div>

        {/* Revenue Split */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-brand-accent text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
                E-Credits
                <InfoTooltip
                  content="E-Credit revenue is calculated based on your charging volume, renewable energy contribution, and current carbon credit market rates."
                  disclaimer="Rates reflect current EU carbon credit pricing and may vary by region."
                />
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {formatEur(results.ecreditCPO)}
              </p>
            </div>
            <div>
              <p className="text-brand-tether text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
                Grid Flexibility
                <InfoTooltip
                  content="Grid flexibility revenue is derived from your charger capacity, flexible availability, and live market prices for frequency regulation services."
                  disclaimer="Market prices vary by month and country, based on real auction data from Nordic and European energy markets."
                />
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {formatEur(results.flexCPO)}
              </p>
            </div>
          </div>

          {/* Revenue Split Bar */}
          <div>
            <div className="flex h-3 rounded-full overflow-hidden bg-white/10">
              <div
                className="bg-brand-accent transition-all duration-500 ease-out"
                style={{ width: `${ecreditPct}%` }}
              />
              <div
                className="bg-brand-tether transition-all duration-500 ease-out"
                style={{ width: `${flexPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-brand-secondary/60">
              <span>E-Credits {ecreditPct}%</span>
              <span>Flexibility {flexPct}%</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
