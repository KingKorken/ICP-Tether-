"use client";

import { useState, useCallback } from "react";
import { parseGoogleMapsUrl, resolveCoordinatesToZone } from "@/lib/calculator/zone-lookup";
import { ZONE_TO_COUNTRY, ZONE_METADATA, COUNTRY_OPTIONS } from "@/lib/calculator/market-data";
import { InfoTooltip } from "@/components/shared/InfoTooltip";
import type { Country } from "@/lib/calculator/types";

interface GoogleMapsLookupProps {
  onChange: (field: "country", value: Country) => void;
}

export function GoogleMapsLookup({ onChange }: GoogleMapsLookupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<{
    zone: string;
    label: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDetect = useCallback(() => {
    setError(null);
    setResult(null);

    if (!url.trim()) return;

    const coords = parseGoogleMapsUrl(url);
    if (!coords) {
      setError("Could not read coordinates. Please paste a Google Maps link or enter coordinates like \"59.33, 18.07\".");
      return;
    }

    const zoneId = resolveCoordinatesToZone(coords.lat, coords.lng);
    if (!zoneId) {
      setError("This location is outside the European electricity market area.");
      return;
    }

    const country = ZONE_TO_COUNTRY[zoneId];
    if (!country) {
      const meta = ZONE_METADATA.find((z) => z.id === zoneId);
      setError(`Detected zone: ${meta?.label ?? zoneId}. This market is coming soon.`);
      return;
    }

    const meta = ZONE_METADATA.find((z) => z.id === zoneId);
    const countryLabel = COUNTRY_OPTIONS.find((c) => c.value === country)?.label ?? country;
    setResult({
      zone: meta?.label ?? zoneId,
      label: countryLabel,
    });
    onChange("country", country);
  }, [url, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleDetect();
      }
    },
    [handleDetect]
  );

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-brand-muted hover:text-brand-primary transition-colors flex items-center gap-1.5"
        type="button"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>{isOpen ? "Hide location lookup" : "Not sure which market?"}</span>
        <InfoTooltip
          content="Paste a Google Maps link of your charging location and we'll automatically detect your electricity market based on the ENTSOE bidding zone boundaries."
          className="ml-0.5"
        />
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
                setResult(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Paste Google Maps link or coordinates..."
              className="flex-1 px-3 py-1.5 bg-brand-light border border-brand-border rounded-lg text-xs text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/15 focus:border-brand-primary-light transition-colors"
            />
            <button
              onClick={handleDetect}
              disabled={!url.trim()}
              type="button"
              className="px-3 py-1.5 bg-brand-primary text-white text-xs font-medium rounded-lg hover:bg-brand-primary-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Detect
            </button>
          </div>

          {error && (
            <p className="text-xs text-brand-warm">{error}</p>
          )}
          {result && (
            <p className="text-xs text-brand-ecredit font-medium">
              Detected: {result.zone} &mdash; Market set to {result.label}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
