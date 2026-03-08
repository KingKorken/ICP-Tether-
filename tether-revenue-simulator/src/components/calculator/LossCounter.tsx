"use client";

import { Card } from "@/components/shared/Card";
import { formatEur } from "@/lib/utils/formatter";

interface LossCounterProps {
  cumulativeTotal: number;
  totalMonths: number;
  companyName: string;
}

export function LossCounter({
  cumulativeTotal,
  totalMonths,
  companyName,
}: LossCounterProps) {
  const displayName = companyName || "your company";

  return (
    <Card
      padding="lg"
      className="mt-8 bg-gradient-to-r from-brand-warm/5 to-brand-warm/10 border-brand-warm/20"
    >
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-brand-warm text-sm font-semibold uppercase tracking-wider mb-3">
          Revenue Left on the Table
        </p>
        <p className="text-4xl lg:text-5xl font-bold text-brand-dark mb-4 tabular-nums">
          {formatEur(cumulativeTotal)}
        </p>
        <p className="text-brand-muted text-lg">
          Over the next{" "}
          <span className="font-semibold text-brand-dark">
            {totalMonths} months
          </span>
          , {displayName} could be earning this from your existing charge
          point infrastructure &mdash; with zero capital investment.
        </p>
      </div>
    </Card>
  );
}
