/**
 * Lead engagement scoring.
 *
 * For MVP with <50 leads, use simple heuristics:
 * - Sort by last_visit_at DESC
 * - Show boolean flags: PDF Exported, Contact Sales Clicked
 * - Show visit count and last visit date
 *
 * The weighted algorithm below is for v2 when data exists to calibrate weights.
 */

export interface EngagementSignals {
  totalVisits: number;
  lastVisitAt: Date | null;
  hasPdfExport: boolean;
  hasContactRequest: boolean;
  hasUnhandledRequest: boolean;
  totalEvents: number;
}

export interface EngagementScore {
  /** Overall score 0-100 */
  score: number;
  /** Engagement level */
  level: "hot" | "warm" | "cool" | "cold";
  /** Individual signals */
  signals: EngagementSignals;
}

/**
 * Calculate engagement score for a lead.
 * Simple heuristic approach — no weighted algorithm for MVP.
 */
export function calculateEngagement(
  signals: EngagementSignals
): EngagementScore {
  let score = 0;

  // Contact request is the strongest signal
  if (signals.hasContactRequest) score += 40;
  if (signals.hasUnhandledRequest) score += 10;

  // PDF export indicates serious interest
  if (signals.hasPdfExport) score += 20;

  // Visit frequency
  if (signals.totalVisits >= 5) score += 15;
  else if (signals.totalVisits >= 3) score += 10;
  else if (signals.totalVisits >= 1) score += 5;

  // Recency (last visit within 7 days = bonus)
  if (signals.lastVisitAt) {
    const daysSinceLastVisit = Math.floor(
      (Date.now() - signals.lastVisitAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastVisit <= 1) score += 15;
    else if (daysSinceLastVisit <= 7) score += 10;
    else if (daysSinceLastVisit <= 30) score += 5;
  }

  // Cap at 100
  score = Math.min(score, 100);

  // Determine level
  let level: EngagementScore["level"];
  if (score >= 60) level = "hot";
  else if (score >= 40) level = "warm";
  else if (score >= 20) level = "cool";
  else level = "cold";

  return { score, level, signals };
}
