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

  const getZoneLabel = (zoneId: BiddingZone): string => {
    const country = ZONE_TO_COUNTRY[zoneId];
    if (country) {
      const countryLabel = COUNTRY_OPTIONS.find((c) => c.value === country)?.label;
      if (countryLabel) return countryLabel;
    }
    const meta = ZONE_METADATA.find((z) => z.id === zoneId);
    return meta?.label ?? zoneId;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-brand-text mb-1.5">
        Electricity Market
      </label>

      {/* Map */}
      <div className="relative bg-[#dce8f0] border border-brand-border rounded-t-lg p-1 overflow-hidden">
        <svg
          viewBox={MAP_VIEWBOX}
          className="w-full h-auto"
          aria-label="European electricity bidding zone map"
          role="img"
          style={{ minHeight: "180px" }}
          preserveAspectRatio="xMidYMid meet"
        >
          {ZONE_PATHS.map((zone) => (
            <path
              key={zone.id}
              d={zone.d}
              fill={getZoneFill(zone.id)}
              stroke={getZoneStroke(zone.id)}
              strokeWidth={isZoneSelected(zone.id) ? 0.8 : 0.2}
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

        {hoveredZone && tooltipPos && (
          <ZoneTooltip zoneId={hoveredZone} position={tooltipPos} />
        )}
      </div>

      {/* Quick-select country buttons below the map */}
      <div className="grid grid-cols-5 border border-t-0 border-brand-border rounded-b-lg overflow-hidden">
        {COUNTRY_OPTIONS.map((country) => (
          <button
            key={country.value}
            onClick={() => onChange("country", country.value)}
            className={`
              py-2 text-xs font-medium transition-colors text-center
              ${
                selectedCountry === country.value
                  ? "bg-brand-primary text-white"
                  : "bg-brand-light text-brand-muted hover:bg-brand-subtle hover:text-brand-text"
              }
            `}
          >
            {country.label === "Netherlands" ? "NL" : country.label === "Sweden" ? "SE" : country.label === "Norway" ? "NO" : country.label === "Germany" ? "DE" : "FR"}
          </button>
        ))}
      </div>
    </div>
  );
}
