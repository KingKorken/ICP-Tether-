import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp, errorResponse } from "@/lib/api-utils";

/**
 * GET /api/admin/export
 * CSV export of leads data.
 * Uses streaming response to avoid memory limits on Vercel.
 * TODO: Add admin auth guard
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimitKey = `admin-export:${ip}`;
  const rateCheck = checkRateLimit(
    rateLimitKey,
    RATE_LIMITS.adminExport.limit,
    RATE_LIMITS.adminExport.windowMs
  );

  if (!rateCheck.allowed) {
    return errorResponse("Too many requests", 429);
  }

  try {
    const supabase = createServerClient();

    const { data: leads, error } = await supabase
      .from("leads")
      .select(
        `
        id, email, company_name, email_domain, is_free_email, is_verified,
        country, created_at, verified_at, last_visit_at, total_visits,
        tokens(token, origin, is_active, last_used_at),
        contact_requests(created_at, is_handled)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Build CSV
    const headers = [
      "Email",
      "Company",
      "Domain",
      "Free Email",
      "Verified",
      "Country",
      "Created",
      "Last Visit",
      "Total Visits",
      "Tokens",
      "Contact Requests",
      "Has PDF Export",
    ];

    const rows = (leads ?? []).map((lead) => {
      const tokens = Array.isArray(lead.tokens) ? lead.tokens : [];
      const contacts = Array.isArray(lead.contact_requests)
        ? lead.contact_requests
        : [];

      return [
        lead.email,
        lead.company_name,
        lead.email_domain,
        lead.is_free_email ? "Yes" : "No",
        lead.is_verified ? "Yes" : "No",
        lead.country ?? "",
        lead.created_at,
        lead.last_visit_at ?? "",
        String(lead.total_visits),
        String(tokens.length),
        String(contacts.length),
        "", // TODO: Check events for pdf.exported
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="tether-leads-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV export failed:", error);
    return errorResponse("Failed to export data", 500);
  }
}
