import { NextRequest } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { emailSchema, isFreeEmail } from "@/lib/utils/email";
import { sanitizeCompanyName } from "@/lib/utils/formatter";
import {
  generateVerificationCode,
  getVerificationCodeExpiry,
  buildMagicLinkUrl,
} from "@/lib/tokens/generator";
import { upsertLead, createToken, getTokensForLead } from "@/lib/db/queries";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  validateOrigin,
  getClientIp,
  errorResponse,
  successResponse,
} from "@/lib/api-utils";
import { MagicLinkEmail } from "@/emails/magic-link";

const requestSchema = z.object({
  email: emailSchema,
  companyName: z.string().max(200).default(""),
});

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }
  return new Resend(apiKey);
}

export async function POST(request: NextRequest) {
  // CSRF check
  if (!validateOrigin(request)) {
    return errorResponse("Invalid origin", 403);
  }

  // Rate limiting
  const ip = getClientIp(request);
  const rateLimitKey = `magic-link:${ip}`;
  const rateCheck = checkRateLimit(
    rateLimitKey,
    RATE_LIMITS.magicLink.limit,
    RATE_LIMITS.magicLink.windowMs
  );

  if (!rateCheck.allowed) {
    return errorResponse("Too many requests. Please try again in a few minutes.", 429);
  }

  // Parse and validate body
  let body: z.infer<typeof requestSchema>;
  try {
    const raw = await request.json();
    body = requestSchema.parse(raw);
  } catch {
    return errorResponse("Invalid request. Please provide a valid email address.");
  }

  const { email, companyName: rawCompany } = body;
  const companyName = sanitizeCompanyName(rawCompany);
  const freeEmail = isFreeEmail(email);

  try {
    // 1. Upsert lead (atomic — handles duplicate emails)
    const lead = await upsertLead({
      email,
      companyName,
      isFreeEmail: freeEmail,
    });

    // 2. Check if lead already has an active token
    const existingTokens = await getTokensForLead(lead.id);
    let accessToken: string;

    if (existingTokens.length > 0 && existingTokens[0].is_active) {
      // Reuse existing token, just generate a new verification code
      accessToken = existingTokens[0].token;
    } else {
      accessToken = ""; // Will be set by createToken
    }

    // 3. Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = getVerificationCodeExpiry();

    // 4. Create token record (or update existing with new verification code)
    if (!accessToken) {
      const token = await createToken({
        leadId: lead.id,
        origin: "organic",
        verificationCode,
        verificationCodeExpiresAt: expiresAt,
      });
      accessToken = token.token;
    } else {
      // Update existing token with new verification code
      const { createServerClient } = await import("@/lib/db/server");
      const supabase = createServerClient();
      await supabase
        .from("tokens")
        .update({
          verification_code: verificationCode,
          verification_code_expires_at: expiresAt,
          verification_attempts: 0,
        })
        .eq("token", accessToken);
    }

    // 5. Send magic link email (AFTER DB transaction)
    const magicLinkUrl = buildMagicLinkUrl(verificationCode);

    await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Tether <noreply@tetherev.io>",
      to: email,
      subject: "Your Revenue Simulator Access — Tether",
      react: MagicLinkEmail({ magicLinkUrl, companyName }),
      headers: {
        "X-Entity-Ref-ID": `magic-link-${Date.now()}`, // Prevent Gmail threading
      },
    });

    return successResponse({
      message: "Check your email for the magic link.",
      email,
    });
  } catch (error) {
    console.error("Magic link request failed:", error);
    return errorResponse("Something went wrong. Please try again.", 500);
  }
}
