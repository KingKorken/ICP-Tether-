"use client";

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
    <div className="border-t border-brand-border/60 pt-10">
      <p className="text-xs font-medium text-brand-warm uppercase tracking-wider mb-2">
        Revenue Left on the Table
      </p>
      <p className="text-3xl lg:text-4xl font-bold text-brand-text mb-3 tabular-nums">
        {formatEur(cumulativeTotal)}
      </p>
      <p className="text-brand-muted text-base max-w-xl">
        Over the next{" "}
        <span className="font-semibold text-brand-text">
          {totalMonths} months
        </span>
        , {displayName} could be earning this from your existing charge
        point infrastructure &mdash; with zero capital investment.
      </p>
    </div>
  );
}
