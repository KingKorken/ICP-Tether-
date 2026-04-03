"use client";

import { ZONE_TO_COUNTRY, ZONE_METADATA, COUNTRY_OPTIONS } from "@/lib/calculator/market-data";
import type { BiddingZone } from "@/lib/calculator/types";

interface ZoneTooltipProps {
  zoneId: BiddingZone;
  position: { x: number; y: number };
}

export function ZoneTooltip({ zoneId, position }: ZoneTooltipProps) {
  const country = ZONE_TO_COUNTRY[zoneId];
  const isSupported = country !== null;

  // For supported zones, show the country name; for unsupported, show the zone label
  let label: string;
  if (isSupported) {
    label = COUNTRY_OPTIONS.find((c) => c.value === country)?.label ?? zoneId;
  } else {
    const meta = ZONE_METADATA.find((z) => z.id === zoneId);
    label = meta?.label ?? zoneId;
  }

  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y + 12}px`,
        transform: "translate(-50%, 0)",
      }}
    >
      <div className="flex justify-center">
        <div className="w-2 h-2 bg-brand-dark transform rotate-45 translate-y-1" />
      </div>
      <div className="bg-brand-dark text-white text-xs rounded-md px-2.5 py-1.5 shadow-lg whitespace-nowrap">
        <span className="font-medium">{label}</span>
        {!isSupported && (
          <span className="ml-1.5 opacity-60">
            Coming soon
          </span>
        )}
      </div>
    </div>
  );
}
