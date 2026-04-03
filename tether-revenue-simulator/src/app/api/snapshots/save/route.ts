import { NextRequest } from "next/server";
import { z } from "zod";
import { saveSnapshot } from "@/lib/db/queries";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  validateOrigin,
  getClientIp,
  errorResponse,
  successResponse,
} from "@/lib/api-utils";

const snapshotSchema = z.object({
  tokenId: z.string().uuid(),
  sessionId: z.string().optional(),
  inputState: z.record(z.unknown()),
  outputResults: z.record(z.unknown()),
  clientVersion: z.number().int().min(1),
});

/**
 * POST /api/snapshots/save
 * Persists calculator state to the snapshots table.
 * Called by SimulatorClient on debounced input changes.
 */
export async function POST(request: NextRequest) {
  // CSRF check
  if (!validateOrigin(request)) {
    return errorResponse("Invalid origin", 403);
  }

  // Rate limiting per token (reuse events config — similar pattern)
  const ip = getClientIp(request);

  let body: z.infer<typeof snapshotSchema>;
  try {
    const raw = await request.json();
    body = snapshotSchema.parse(raw);
  } catch {
    return errorResponse("Invalid request body");
  }

  const rateLimitKey = `snapshot:${body.tokenId}:${ip}`;
  const rateCheck = checkRateLimit(
    rateLimitKey,
    RATE_LIMITS.events.limit,
    RATE_LIMITS.events.windowMs
  );

  if (!rateCheck.allowed) {
    // Silent 429 — don't break user experience
    return successResponse({ saved: false, reason: "rate_limited" }, 429);
  }

  try {
    const snapshot = await saveSnapshot({
      tokenId: body.tokenId,
      sessionId: body.sessionId,
      inputState: body.inputState,
      outputResults: body.outputResults,
      clientVersion: body.clientVersion,
    });

    return successResponse({
      saved: !!snapshot,
      snapshotId: snapshot?.id ?? null,
    });
  } catch (error) {
    console.error("Snapshot save failed:", error);
    // Silent failure — never break the user experience for persistence
    return successResponse({ saved: false });
  }
}
