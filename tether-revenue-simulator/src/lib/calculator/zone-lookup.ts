import { ZONE_METADATA } from "./market-data";
import type { BiddingZone } from "./types";

/**
 * Parse a Google Maps URL to extract lat/lng coordinates.
 *
 * Supported patterns:
 * - https://www.google.com/maps/@59.33,18.07,12z
 * - https://www.google.com/maps/place/.../@59.33,18.07,12z
 * - https://maps.google.com/?q=59.33,18.07
 * - https://www.google.com/maps?q=59.33,18.07
 * - Raw coordinates: "59.33, 18.07"
 */
export function parseGoogleMapsUrl(
  input: string
): { lat: number; lng: number } | null {
  try {
    const trimmed = input.trim();

    // Pattern 1: /@lat,lng in URL
    const atMatch = trimmed.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    // Pattern 2: ?q=lat,lng or &q=lat,lng
    const qMatch = trimmed.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (qMatch) {
      return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    }

    // Pattern 3: Raw coordinates "59.33, 18.07"
    const rawMatch = trimmed.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (rawMatch) {
      return { lat: parseFloat(rawMatch[1]), lng: parseFloat(rawMatch[2]) };
    }

    // Pattern 4: place/ coordinates in path
    const placeMatch = trimmed.match(/place\/[^/]*\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (placeMatch) {
      return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
    }

    return null;
  } catch {
    return null;
  }
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
