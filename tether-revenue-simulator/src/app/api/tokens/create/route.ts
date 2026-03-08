import { NextRequest } from "next/server";
import { z } from "zod";
import { createToken, upsertLead } from "@/lib/db/queries";
import { isFreeEmail } from "@/lib/utils/email";
import { sanitizeCompanyName } from "@/lib/utils/formatter";
import { buildCalculatorUrl } from "@/lib/tokens/generator";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  validateOrigin,
  getClientIp,
  errorResponse,
  successResponse,
} from "@/lib/api-utils";

const createTokenSchema = z.object({
  email: z.string().email().max(254),
  companyName: z.string().max(200).default(""),
  prefilledData: z.record(z.unknown()).optional(),
});

/**
 * POST /api/tokens/create
 * Admin endpoint to create sales-generated tokens.
 * TODO: Add admin auth guard (Supabase Auth check)
 */
export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return errorResponse("Invalid origin", 403);
  }

  // Rate limiting
  const ip = getClientIp(request);
  const rateLimitKey = `token-create:${ip}`;
  const rateCheck = checkRateLimit(
    rateLimitKey,
    RATE_LIMITS.tokenCreate.limit,
    RATE_LIMITS.tokenCreate.windowMs
  );

  if (!rateCheck.allowed) {
    return errorResponse("Too many requests", 429);
  }

  // TODO: Validate admin session here
  // const adminSession = await validateAdminSession(request);
  // if (!adminSession) return errorResponse("Unauthorized", 401);

  let body: z.infer<typeof createTokenSchema>;
  try {
    const raw = await request.json();
    body = createTokenSchema.parse(raw);
  } catch {
    return errorResponse("Invalid request body");
  }

  try {
    const companyName = sanitizeCompanyName(body.companyName);
    const freeEmail = isFreeEmail(body.email);

    // Upsert lead
    const lead = await upsertLead({
      email: body.email.toLowerCase().trim(),
      companyName,
      isFreeEmail: freeEmail,
    });

    // Create sales-generated token (no verification code needed)
    const token = await createToken({
      leadId: lead.id,
      origin: "sales_generated",
      prefilledData: body.prefilledData,
    });

    const calculatorUrl = buildCalculatorUrl(token.token);

    return successResponse({
      token: token.token,
      calculatorUrl,
      lead: {
        id: lead.id,
        email: lead.email,
        companyName: lead.company_name,
      },
    });
  } catch (error) {
    console.error("Token creation failed:", error);
    return errorResponse("Failed to create token", 500);
  }
}
