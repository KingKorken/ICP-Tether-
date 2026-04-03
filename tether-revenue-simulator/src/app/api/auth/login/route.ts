import { NextRequest } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/db/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  validateOrigin,
  getClientIp,
  errorResponse,
  successResponse,
} from "@/lib/api-utils";

const loginSchema = z.object({
  email: z.string().email().max(254),
  companyName: z.string().min(1).max(200),
});

/**
 * POST /api/auth/login
 * Prospect login: verify email + company name match an existing lead
 * with an active sales-generated token. Returns the calculator URL.
 */
export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return errorResponse("Invalid origin", 403);
  }

  // Rate limiting
  const ip = getClientIp(request);
  const rateLimitKey = `prospect-login:${ip}`;
  const rateCheck = checkRateLimit(
    rateLimitKey,
    RATE_LIMITS.magicLink.limit,
    RATE_LIMITS.magicLink.windowMs
  );

  if (!rateCheck.allowed) {
    return errorResponse("Too many attempts. Please try again later.", 429);
  }

  let body: z.infer<typeof loginSchema>;
  try {
    const raw = await request.json();
    body = loginSchema.parse(raw);
  } catch {
    return errorResponse("Please enter a valid email and company name.");
  }

  try {
    const supabase = createServerClient();
    const email = body.email.toLowerCase().trim();
    const companyName = body.companyName.trim();

    // Find the lead by email
    const { data: lead } = await supabase
      .from("leads")
      .select("id, email, company_name, total_visits")
      .eq("email", email)
      .single();

    if (!lead) {
      return errorResponse(
        "No account found with this email. Please contact your Tether representative.",
        404
      );
    }

    // Verify company name matches (case-insensitive)
    if (lead.company_name.toLowerCase() !== companyName.toLowerCase()) {
      return errorResponse(
        "The company name doesn't match our records. Please check and try again.",
        401
      );
    }

    // Find an active token for this lead
    const { data: token } = await supabase
      .from("tokens")
      .select("token")
      .eq("lead_id", lead.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!token) {
      return errorResponse(
        "Your account is not active. Please contact your Tether representative.",
        403
      );
    }

    // Update visit tracking
    await supabase
      .from("leads")
      .update({
        last_visit_at: new Date().toISOString(),
        total_visits: lead.total_visits ?? 0 + 1,
      })
      .eq("id", lead.id);

    // Return the calculator URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tether-revenue-simulator.vercel.app";
    const calculatorUrl = `${baseUrl}/sim/t/${token.token}`;

    return successResponse({
      calculatorUrl,
      redirectTo: `/sim/t/${token.token}`,
    });
  } catch (error) {
    console.error("Prospect login failed:", error);
    return errorResponse("Something went wrong. Please try again.", 500);
  }
}
