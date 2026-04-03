import { NextRequest } from "next/server";
import {
  getLeadDetail,
  getLeadSnapshots,
  getLeadEngagementKPIs,
  getLeadSessions,
} from "@/lib/db/queries";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/auth/admin";

/**
 * GET /api/admin/analytics/[leadId]
 * Per-user analytics: KPIs, sessions, snapshots, calculator data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const rateLimitKey = `admin:${auth.session.adminId}`;
  const rateCheck = checkRateLimit(
    rateLimitKey,
    RATE_LIMITS.adminApi.limit,
    RATE_LIMITS.adminApi.windowMs
  );

  if (!rateCheck.allowed) {
    return errorResponse("Too many requests", 429);
  }

  const { leadId } = await params;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(leadId)) {
    return errorResponse("Invalid lead ID", 400);
  }

  try {
    const [lead, snapshots, kpis, sessions] = await Promise.all([
      getLeadDetail(leadId),
      getLeadSnapshots(leadId),
      getLeadEngagementKPIs(leadId),
      getLeadSessions(leadId),
    ]);

    if (!lead) {
      return errorResponse("Lead not found", 404);
    }

    return successResponse({
      lead,
      snapshots,
      kpis,
      sessions,
    });
  } catch (error) {
    console.error("Per-user analytics query failed:", error);
    return errorResponse("Failed to fetch user analytics", 500);
  }
}
