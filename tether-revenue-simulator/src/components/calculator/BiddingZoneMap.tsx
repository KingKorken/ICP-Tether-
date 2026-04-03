"use client";

import { useState, useCallback } from "react";
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

  const handleTouchEnd = useCallback(
    (zoneId: BiddingZone) => {
      const country = ZONE_TO_COUNTRY[zoneId];
      if (country) {
        onChange("country", country);
      }
      setHoveredZone(zoneId);
      setTimeout(() => {
        setHoveredZone(null);
        setTooltipPos(null);
      }, 2000);
    },
    [onChange]
  );

  // Check if a zone belongs to the currently selected country
  const isZoneSelected = (zoneId: BiddingZone): boolean => {
    const zoneCountry = ZONE_TO_COUNTRY[zoneId];
    return zoneCountry === selectedCountry;
  };

  const getZoneFill = (zoneId: BiddingZone): string => {
    const country = ZONE_TO_COUNTRY[zoneId];
    const isSelected = isZoneSelected(zoneId);
    const isHovered = hoveredZone === zoneId;

    if (isSelected) {
      return isHovered ? "#2d5a42" : "#1a3a2a";
    }
    if (country !== null) {
      return isHovered ? "rgba(58, 125, 92, 0.5)" : "rgba(58, 125, 92, 0.25)";
    }
    return isHovered ? "#d4dbd7" : "#e8ede9";
  };

  const getZoneStroke = (zoneId: BiddingZone): string => {
    if (isZoneSelected(zoneId)) return "#f3f5f4";
    return "rgba(212, 219, 215, 0.6)";
  };

  const getZoneCursor = (zoneId: BiddingZone): string => {
    return ZONE_TO_COUNTRY[zoneId] !== null ? "pointer" : "default";
  };

  // Get a display label for a zone in the tooltip
  const getZoneLabel = (zoneId: BiddingZone): string => {
    // For representative zones (SE3, NO1), show the country name
    const country = ZONE_TO_COUNTRY[zoneId];
    if (country) {
      const countryLabel = COUNTRY_OPTIONS.find((c) => c.value === country)?.label;
      if (countryLabel) return countryLabel;
    }
    // For unsupported zones, use the metadata label
    const meta = ZONE_METADATA.find((z) => z.id === zoneId);
    return meta?.label ?? zoneId;
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
          style={{ minHeight: "200px" }}
        >
          {/* Zone paths */}
          {ZONE_PATHS.map((zone) => (
            <path
              key={zone.id}
              d={zone.d}
              fill={getZoneFill(zone.id)}
              stroke={getZoneStroke(zone.id)}
              strokeWidth={isZoneSelected(zone.id) ? 1 : 0.3}
              strokeLinejoin="round"
              style={{
                cursor: getZoneCursor(zone.id),
                transition: "fill 0.15s ease",
              }}
              onClick={() => handleZoneClick(zone.id)}
              onMouseEnter={(e) => handleMouseEnter(e, zone.id)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchEnd={() => handleTouchEnd(zone.id)}
              aria-label={getZoneLabel(zone.id)}
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
