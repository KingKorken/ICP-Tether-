"use client";

import { ZONE_TO_COUNTRY, ZONE_METADATA } from "@/lib/calculator/market-data";
import type { BiddingZone } from "@/lib/calculator/types";

interface ZoneTooltipProps {
  zoneId: BiddingZone;
  position: { x: number; y: number };
}

export function ZoneTooltip({ zoneId, position }: ZoneTooltipProps) {
  const meta = ZONE_METADATA.find((z) => z.id === zoneId);
  const country = ZONE_TO_COUNTRY[zoneId];
  const isSupported = country !== null;

  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y + 12}px`,
        transform: "translate(-50%, 0)",
      }}
    >
      {/* Arrow pointing up */}
      <div className="flex justify-center">
        <div className="w-2 h-2 bg-brand-dark transform rotate-45 translate-y-1" />
      </div>
      <div className="bg-brand-dark text-white text-xs rounded-md px-2.5 py-1.5 shadow-lg whitespace-nowrap">
        <span className="font-medium">{meta?.label ?? zoneId}</span>
        {!isSupported && (
          <span className="ml-1.5 text-brand-muted/70">
            Coming soon
          </span>
        )}
        {isSupported && (
          <span className="ml-1.5 text-brand-tether/80">
            Click to select
          </span>
        )}
      </div>
    </div>
  );
}
