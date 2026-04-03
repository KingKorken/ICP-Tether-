import { ZONE_METADATA } from "./market-data";
import type { BiddingZone } from "./types";

/**
 * Parse a Google Maps URL or coordinates string to extract lat/lng.
 *
 * Handles many formats:
 * - https://www.google.com/maps/@59.3293,18.0686,12z
 * - https://www.google.com/maps/place/Stockholm/@59.3293,18.0686,12z
 * - https://www.google.com/maps/place/59.3293,18.0686
 * - https://maps.google.com/?q=59.3293,18.0686
 * - https://www.google.com/maps?q=59.3293,18.0686
 * - https://maps.google.com/maps?ll=59.3293,18.0686
 * - https://www.google.com/maps/dir//59.3293,18.0686
 * - https://maps.app.goo.gl/... (shortened — can't parse, show message)
 * - https://goo.gl/maps/... (shortened — can't parse, show message)
 * - Raw coordinates: "59.33, 18.07"
 * - Raw coordinates: "59.3293 18.0686" (space separated)
 */
export function parseGoogleMapsUrl(
  input: string
): { lat: number; lng: number } | null {
  try {
    const trimmed = input.trim();

    // Check for shortened URLs that we can't parse client-side
    if (trimmed.includes("goo.gl/") || trimmed.includes("maps.app.goo.gl")) {
      return null; // Caller should show a message about using the full URL
    }

    // Pattern: /@lat,lng anywhere in the URL
    const atMatch = trimmed.match(/@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      if (isValidCoord(lat, lng)) return { lat, lng };
    }

    // Pattern: ?q=lat,lng or &q=lat,lng
    const qMatch = trimmed.match(/[?&]q=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (qMatch) {
      const lat = parseFloat(qMatch[1]);
      const lng = parseFloat(qMatch[2]);
      if (isValidCoord(lat, lng)) return { lat, lng };
    }

    // Pattern: ?ll=lat,lng or &ll=lat,lng
    const llMatch = trimmed.match(/[?&]ll=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (llMatch) {
      const lat = parseFloat(llMatch[1]);
      const lng = parseFloat(llMatch[2]);
      if (isValidCoord(lat, lng)) return { lat, lng };
    }

    // Pattern: /dir//lat,lng or /place/lat,lng
    const pathMatch = trimmed.match(/\/(dir|place)\/[^@]*?(-?\d+\.\d{2,}),\s*(-?\d+\.\d{2,})/);
    if (pathMatch) {
      const lat = parseFloat(pathMatch[2]);
      const lng = parseFloat(pathMatch[3]);
      if (isValidCoord(lat, lng)) return { lat, lng };
    }

    // Pattern: any two decimal numbers that look like coordinates in the URL
    const genericMatch = trimmed.match(/(-?\d+\.\d{3,}),\s*(-?\d+\.\d{3,})/);
    if (genericMatch) {
      const lat = parseFloat(genericMatch[1]);
      const lng = parseFloat(genericMatch[2]);
      if (isValidCoord(lat, lng)) return { lat, lng };
    }

    // Raw coordinates with comma: "59.33, 18.07"
    const commaMatch = trimmed.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (commaMatch) {
      const lat = parseFloat(commaMatch[1]);
      const lng = parseFloat(commaMatch[2]);
      if (isValidCoord(lat, lng)) return { lat, lng };
    }

    // Raw coordinates with space: "59.33 18.07"
    const spaceMatch = trimmed.match(/^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)$/);
    if (spaceMatch) {
      const lat = parseFloat(spaceMatch[1]);
      const lng = parseFloat(spaceMatch[2]);
      if (isValidCoord(lat, lng)) return { lat, lng };
    }

    return null;
  } catch {
    return null;
  }
}

function isValidCoord(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Resolve lat/lng to the nearest ENTSOE bidding zone.
 * Uses Haversine distance to find the nearest zone center.
 */
export function resolveCoordinatesToZone(
  lat: number,
  lng: number
): BiddingZone | null {
  // Reject coordinates outside reasonable European bounds
  if (lat < 34 || lat > 72 || lng < -12 || lng > 35) {
    return null;
  }

  let closest: BiddingZone | null = null;
  let minDist = Infinity;

  for (const zone of ZONE_METADATA) {
    const dist = haversine(lat, lng, zone.center.lat, zone.center.lng);
    if (dist < minDist) {
      minDist = dist;
      closest = zone.id;
    }
  }

  // If nearest center is more than 500km away, likely outside all zones
  if (minDist > 500) return null;

  return closest;
}

function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
