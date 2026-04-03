"use client";

import { useState, useCallback, useMemo } from "react";
import { ZONE_PATHS, MAP_VIEWBOX } from "@/lib/calculator/svg-paths";
import { ZONE_TO_COUNTRY, ZONE_METADATA, COUNTRY_OPTIONS } from "@/lib/calculator/market-data";
import type { Country, BiddingZone } from "@/lib/calculator/types";
import { ZoneTooltip } from "./ZoneTooltip";

interface BiddingZoneMapProps {
  selectedCountry: Country;
  onChange: (field: "country", value: Country) => void;
}

export function BiddingZoneMap({ selectedCountry, onChange }: BiddingZoneMapProps) {
  const [hoveredZone, setHoveredZone] = useState<BiddingZone | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Zones belonging to the currently selected country
  const selectedZones = useMemo(() => {
    return ZONE_METADATA
      .filter((z) => z.country === selectedCountry)
      .map((z) => z.id);
  }, [selectedCountry]);

  const handleZoneClick = useCallback(
    (zoneId: BiddingZone) => {
      const country = ZONE_TO_COUNTRY[zoneId];
      if (country) {
        onChange("country", country);
      }
    },
    [onChange]
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<SVGPathElement>, zoneId: BiddingZone) => {
      setHoveredZone(zoneId);
      const svgEl = (e.target as SVGPathElement).closest("svg");
      if (svgEl) {
        const rect = svgEl.getBoundingClientRect();
        setTooltipPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGPathElement>) => {
      const svgEl = (e.target as SVGPathElement).closest("svg");
      if (svgEl) {
        const rect = svgEl.getBoundingClientRect();
        setTooltipPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredZone(null);
    setTooltipPos(null);
  }, []);

  // Touch support: tap to show tooltip + select
  const handleTouchEnd = useCallback(
    (zoneId: BiddingZone) => {
      const country = ZONE_TO_COUNTRY[zoneId];
      if (country) {
        onChange("country", country);
      }
      setHoveredZone(zoneId);
      // Auto-dismiss tooltip after 2 seconds on touch
      setTimeout(() => {
        setHoveredZone(null);
        setTooltipPos(null);
      }, 2000);
    },
    [onChange]
  );

  const getZoneFill = (zoneId: BiddingZone): string => {
    const country = ZONE_TO_COUNTRY[zoneId];
    const isSelected = selectedZones.includes(zoneId);
    const isHovered = hoveredZone === zoneId;

    if (isSelected) {
      return isHovered ? "#2d5a42" : "#1a3a2a"; // brand-primary-light : brand-primary
    }
    if (country !== null) {
      // Supported but not selected
      return isHovered ? "rgba(58, 125, 92, 0.5)" : "rgba(58, 125, 92, 0.25)"; // brand-ecredit
    }
    // Unsupported
    return isHovered ? "#d4dbd7" : "#e8ede9"; // brand-border : brand-subtle
  };

  const getZoneStroke = (zoneId: BiddingZone): string => {
    const isSelected = selectedZones.includes(zoneId);
    if (isSelected) return "#f3f5f4"; // brand-light
    return "rgba(212, 219, 215, 0.6)"; // brand-border/60
  };

  const getZoneCursor = (zoneId: BiddingZone): string => {
    return ZONE_TO_COUNTRY[zoneId] !== null ? "pointer" : "default";
  };

  const selectedLabel = COUNTRY_OPTIONS.find((c) => c.value === selectedCountry)?.label ?? selectedCountry;

  return (
    <div>
      <label className="block text-sm font-medium text-brand-text mb-1.5">
        Electricity Market
      </label>
      <div className="relative bg-[#dce8f0] border border-brand-border rounded-lg p-1.5 overflow-hidden">
        <svg
          viewBox={MAP_VIEWBOX}
          className="w-full h-auto"
          aria-label="European electricity bidding zone map"
          role="img"
        >
          {/* Zone paths */}
          {ZONE_PATHS.map((zone) => (
            <path
              key={zone.id}
              d={zone.d}
              fill={getZoneFill(zone.id)}
              stroke={getZoneStroke(zone.id)}
              strokeWidth={selectedZones.includes(zone.id) ? 1.5 : 0.5}
              style={{ cursor: getZoneCursor(zone.id) }}
              onClick={() => handleZoneClick(zone.id)}
              onMouseEnter={(e) => handleMouseEnter(e, zone.id)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchEnd={() => handleTouchEnd(zone.id)}
              aria-label={
                ZONE_METADATA.find((m) => m.id === zone.id)?.label ?? zone.id
              }
              role={ZONE_TO_COUNTRY[zone.id] ? "button" : undefined}
              tabIndex={ZONE_TO_COUNTRY[zone.id] ? 0 : undefined}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && ZONE_TO_COUNTRY[zone.id]) {
                  e.preventDefault();
                  handleZoneClick(zone.id);
                }
              }}
            />
          ))}

          {/* Zone labels for supported countries */}
          {ZONE_METADATA
            .filter((z) => z.country !== null)
            .map((zone) => {
              const x = Math.round(((zone.center.lng + 12) / 47) * 800);
              const y = Math.round(((72 - zone.center.lat) / 38) * 600);
              const isSelected = selectedZones.includes(zone.id);
              return (
                <text
                  key={`label-${zone.id}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                  fill={isSelected ? "#f3f5f4" : "#1a3a2a"}
                  fontSize="11"
                  fontWeight={isSelected ? "600" : "400"}
                  opacity={isSelected ? 1 : 0.7}
                >
                  {zone.id}
                </text>
              );
            })}
        </svg>

        {/* Floating tooltip */}
        {hoveredZone && tooltipPos && (
          <ZoneTooltip zoneId={hoveredZone} position={tooltipPos} />
        )}
      </div>

      {/* Selected market indicator */}
      <div className="mt-1.5 flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm bg-brand-primary flex-shrink-0" />
        <span className="text-xs text-brand-muted">
          Selected: <span className="font-medium text-brand-text">{selectedLabel}</span>
        </span>
      </div>
    </div>
  );
}
