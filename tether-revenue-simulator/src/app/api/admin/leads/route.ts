import { NextRequest } from "next/server";
import { getLeadsForAdmin } from "@/lib/db/queries";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp, errorResponse, successResponse } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/auth/admin";

/**
 * GET /api/admin/leads
 * Admin endpoint to get lead list with engagement data.
 */
export async function GET(request: NextRequest) {
  // Admin auth guard
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const ip = getClientIp(request);
  const rateLimitKey = `admin:${auth.session.adminId}`;
  const rateCheck = checkRateLimit(
    rateLimitKey,
    RATE_LIMITS.adminApi.limit,
    RATE_LIMITS.adminApi.windowMs
  );

  if (!rateCheck.allowed) {
    return errorResponse("Too many requests", 429);
  }

  const limit = parseInt(
    request.nextUrl.searchParams.get("limit") ?? "50"
  );
  const offset = parseInt(
    request.nextUrl.searchParams.get("offset") ?? "0"
  );
  const orderBy = request.nextUrl.searchParams.get("orderBy") ?? "last_visit_at";

  try {
    const { leads, total } = await getLeadsForAdmin({
      limit: Math.min(limit, 100),
      offset: Math.max(offset, 0),
      orderBy,
    });

    return successResponse({ leads, total, limit, offset });
  } catch (error) {
    console.error("Admin leads query failed:", error);
    return errorResponse("Failed to fetch leads", 500);
  }
}
