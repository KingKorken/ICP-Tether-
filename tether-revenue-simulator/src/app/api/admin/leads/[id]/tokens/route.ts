import { NextRequest } from "next/server";
import { z } from "zod";
import { setTokenActive, logAdminAction } from "@/lib/db/queries";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  validateOrigin,
  errorResponse,
  successResponse,
} from "@/lib/api-utils";
import { requireAdmin } from "@/lib/auth/admin";

const patchSchema = z.object({
  tokenId: z.string().uuid(),
  isActive: z.boolean(),
});

/**
 * PATCH /api/admin/leads/[id]/tokens
 * Activate or deactivate a token for a lead.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateOrigin(request)) {
    return errorResponse("Invalid origin", 403);
  }

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

  let body: z.infer<typeof patchSchema>;
  try {
    const raw = await request.json();
    body = patchSchema.parse(raw);
  } catch {
    return errorResponse("Invalid request body");
  }

  try {
    await setTokenActive(body.tokenId, body.isActive);

    // Audit log
    await logAdminAction({
      adminId: auth.session.adminId,
      action: body.isActive ? "token_activated" : "token_deactivated",
      targetId: leadId,
      metadata: { tokenId: body.tokenId },
    });

    return successResponse({
      success: true,
      tokenId: body.tokenId,
      isActive: body.isActive,
    });
  } catch (error) {
    console.error("Token update failed:", error);
    return errorResponse("Failed to update token", 500);
  }
}
