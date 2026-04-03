import { NextRequest } from "next/server";
import {
  getLeadDetail,
  getLeadSnapshots,
  getLeadEngagementKPIs,
} from "@/lib/db/queries";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/auth/admin";

/**
 * GET /api/admin/leads/[id]
 * Detailed lead view with KPIs, snapshots, and engagement data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Admin auth guard
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

  const { id: leadId } = await params;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(leadId)) {
    return errorResponse("Invalid lead ID", 400);
  }

  try {
    // Fetch all data in parallel
    const [lead, snapshots, kpis] = await Promise.all([
      getLeadDetail(leadId),
      getLeadSnapshots(leadId),
      getLeadEngagementKPIs(leadId),
    ]);

    if (!lead) {
      return errorResponse("Lead not found", 404);
    }

    return successResponse({
      lead,
      snapshots,
      kpis,
    });
  } catch (error) {
    console.error("Lead detail query failed:", error);
    return errorResponse("Failed to fetch lead details", 500);
  }
}
