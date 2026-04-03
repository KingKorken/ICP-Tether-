import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/db/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp, errorResponse, successResponse } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/auth/admin";

/**
 * GET /api/admin/analytics
 * Aggregate market intelligence for the leadership view.
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

  try {
    const supabase = createServerClient();

    // Total leads
    const { count: totalLeads } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true });

    // Verified leads
    const { count: verifiedLeads } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("is_verified", true);

    // Contact requests
    const { count: totalContactRequests } = await supabase
      .from("contact_requests")
      .select("*", { count: "exact", head: true });

    const { count: unhandledContactRequests } = await supabase
      .from("contact_requests")
      .select("*", { count: "exact", head: true })
      .eq("is_handled", false);

    // PDF exports count
    const { count: pdfExports } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "pdf.exported");

    // Country distribution from latest snapshots
    const { data: countryData } = await supabase
      .from("snapshots")
      .select("input_state");

    const countryDistribution: Record<string, number> = {};
    if (countryData) {
      for (const snapshot of countryData) {
        const state = snapshot.input_state as Record<string, unknown>;
        const country = String(state?.country ?? "unknown");
        countryDistribution[country] = (countryDistribution[country] ?? 0) + 1;
      }
    }

    return successResponse({
      totalLeads: totalLeads ?? 0,
      verifiedLeads: verifiedLeads ?? 0,
      totalContactRequests: totalContactRequests ?? 0,
      unhandledContactRequests: unhandledContactRequests ?? 0,
      pdfExports: pdfExports ?? 0,
      countryDistribution,
    });
  } catch (error) {
    console.error("Admin analytics query failed:", error);
    return errorResponse("Failed to fetch analytics", 500);
  }
}
