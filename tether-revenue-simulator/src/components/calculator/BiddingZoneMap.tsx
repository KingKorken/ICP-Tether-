"use client";

import { useEffect, useRef, useState } from "react";
import { ZONE_TO_COUNTRY, ZONE_METADATA, COUNTRY_OPTIONS } from "@/lib/calculator/market-data";
import type { Country, BiddingZone } from "@/lib/calculator/types";
import type L from "leaflet";

interface BiddingZoneMapProps {
  selectedCountry: Country;
  onChange: (field: "country", value: Country) => void;
}

// Map from GeoJSON zone names (SE_1) to our BiddingZone type (SE1)
const GEOJSON_TO_ZONE: Record<string, BiddingZone> = {
  SE_1: "SE1", SE_2: "SE2", SE_3: "SE3", SE_4: "SE4",
  NO_1: "NO1", NO_2: "NO2", NO_3: "NO3", NO_4: "NO4", NO_5: "NO5",
  DE_LU: "DE_LU", NL: "NL", FR: "FR",
  DK_1: "DK1", DK_2: "DK2", FI: "FI",
  EE: "EE", LV: "LV", LT: "LT",
  PL: "PL", CZ: "CZ", SK: "SK",
  AT: "AT", CH: "CH", BE: "BE",
  ES: "ES", PT: "PT",
  IT_NORD: "IT", IT_CNOR: "IT", IT_CSUD: "IT", IT_SUD: "IT", IT_SICI: "IT", IT_SARD: "IT",
  GR: "GR", RO: "RO", BG: "BG",
  HR: "HR", SI: "SI", HU: "HU",
  RS: "RS",
};

function getZoneLabel(geoJsonName: string): string {
  const zoneId = GEOJSON_TO_ZONE[geoJsonName];
  if (!zoneId) return geoJsonName;

  const country = ZONE_TO_COUNTRY[zoneId];
  if (country) {
    const label = COUNTRY_OPTIONS.find((c) => c.value === country)?.label;
    if (geoJsonName.startsWith("SE_") || geoJsonName.startsWith("NO_")) {
      const meta = ZONE_METADATA.find((z) => z.id === zoneId);
      return meta?.label ?? `${zoneId} (${label})`;
    }
    if (geoJsonName.startsWith("IT_")) {
      return `Italy (${geoJsonName.replace("IT_", "")})`;
    }
    return label ?? zoneId;
  }

  const meta = ZONE_METADATA.find((z) => z.id === zoneId);
  return meta?.label ?? geoJsonName;
}

// Style helpers — zone borders always visible to show bidding zone boundaries
function getSelectedStyle(): L.PathOptions {
  return { fillColor: "#1a3a2a", fillOpacity: 0.7, color: "#ffffff", weight: 1.5 };
}
function getSupportedStyle(): L.PathOptions {
  return { fillColor: "#3a7d5c", fillOpacity: 0.25, color: "#ffffff", weight: 1 };
}
function getUnsupportedStyle(): L.PathOptions {
  return { fillColor: "#e0e5e2", fillOpacity: 0.6, color: "#ffffff", weight: 1 };
}

export function BiddingZoneMap({ selectedCountry, onChange }: BiddingZoneMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Use refs for callbacks so Leaflet event handlers always have latest values
  const selectedCountryRef = useRef(selectedCountry);
  selectedCountryRef.current = selectedCountry;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Initialize Leaflet map (once)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let map: L.Map;

    import("leaflet").then((L) => {
      // Fix default icon paths for Leaflet in bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      if (!mapContainerRef.current) return;

      map = L.map(mapContainerRef.current, {
        center: [54, 10],
        zoom: 4,
        minZoom: 3,
        maxZoom: 7,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
      });

      // Clean basemap
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { maxZoom: 19 }
      ).addTo(map);

      mapInstanceRef.current = map;

      // Load GeoJSON data
      fetch("/europe-zones.geojson")
        .then((res) => res.json())
        .then((data: GeoJSON.FeatureCollection) => {
          const geoLayer = L.geoJSON(data, {
            style: (feature) => {
              if (!feature) return {};
              const geoName = feature.properties?.zoneName as string;
              const zoneId = GEOJSON_TO_ZONE[geoName];
              if (!zoneId) return getUnsupportedStyle();

              const country = ZONE_TO_COUNTRY[zoneId];
              if (!country) return getUnsupportedStyle();
              if (country === selectedCountryRef.current) return getSelectedStyle();
              return getSupportedStyle();
            },
            onEachFeature: (feature, layer) => {
              const geoName = feature.properties?.zoneName as string;
              const zoneId = GEOJSON_TO_ZONE[geoName];
              const label = getZoneLabel(geoName);
              const country = zoneId ? ZONE_TO_COUNTRY[zoneId] : null;

              // Tooltip
              const tooltipHtml = country
                ? `<strong>${label}</strong>`
                : `<strong>${label}</strong><br/><span style="opacity:0.6;font-size:11px">Coming soon</span>`;

              layer.bindTooltip(tooltipHtml, {
                sticky: true,
                direction: "top",
                offset: L.point(0, -10),
                className: "zone-tooltip",
              });

              // Click to select
              layer.on("click", () => {
                if (country) {
                  onChangeRef.current("country", country);
                }
              });

              // Hover highlight
              layer.on("mouseover", () => {
                const path = layer as L.Path;
                if (country) {
                  path.setStyle({ fillOpacity: 0.6 });
                } else {
                  path.setStyle({ fillOpacity: 0.35 });
                }
              });

              layer.on("mouseout", () => {
                geoJsonLayerRef.current?.resetStyle(layer as L.Path);
              });
            },
          });

          geoLayer.addTo(map);
          geoJsonLayerRef.current = geoLayer;
          setIsLoaded(true);
        });
    });

    // Leaflet CSS is loaded via link tag to avoid build issues
    const linkEl = document.createElement("link");
    linkEl.rel = "stylesheet";
    linkEl.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(linkEl);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        geoJsonLayerRef.current = null;
      }
    };
  }, []);

  // Update styles when selectedCountry changes
  useEffect(() => {
    if (!geoJsonLayerRef.current || !isLoaded) return;

    geoJsonLayerRef.current.eachLayer((layer) => {
      const feature = (layer as L.GeoJSON & { feature?: GeoJSON.Feature }).feature;
      if (!feature) return;

      const geoName = feature.properties?.zoneName as string;
      const zoneId = GEOJSON_TO_ZONE[geoName];
      if (!zoneId) {
        (layer as L.Path).setStyle(getUnsupportedStyle());
        return;
      }

      const country = ZONE_TO_COUNTRY[zoneId];
      if (!country) {
        (layer as L.Path).setStyle(getUnsupportedStyle());
      } else if (country === selectedCountry) {
        (layer as L.Path).setStyle(getSelectedStyle());
      } else {
        (layer as L.Path).setStyle(getSupportedStyle());
      }
    });
  }, [selectedCountry, isLoaded]);

  const selectedLabel = COUNTRY_OPTIONS.find((c) => c.value === selectedCountry)?.label ?? selectedCountry;

  return (
    <div>
      <label className="block text-sm font-medium text-brand-text mb-1.5">
        Electricity Market
      </label>
      <div
        ref={mapContainerRef}
        className="w-full rounded-lg border border-brand-border overflow-hidden"
        style={{ height: "280px", background: "#dce8f0" }}
      />
      <div className="mt-1.5 flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm bg-brand-primary flex-shrink-0" />
        <span className="text-xs text-brand-muted">
          Selected: <span className="font-medium text-brand-text">{selectedLabel}</span>
        </span>
      </div>
    </div>
  );
}
