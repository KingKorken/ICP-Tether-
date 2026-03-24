import { NextRequest } from "next/server";
import { z } from "zod";
import { SimulatorStateSchema } from "@/lib/calculator/types";
import { saveSnapshot } from "@/lib/db/queries";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  validateOrigin,
  getClientIp,
  errorResponse,
  successResponse,
} from "@/lib/api-utils";

const SnapshotRequestSchema = z.object({
  token_id: z.string().uuid(),
  session_id: z.string().uuid().optional(),
  input_state: SimulatorStateSchema,
  output_results: z.record(z.unknown()),
  client_version: z.number().int().min(0),
});

/**
 * POST /api/snapshots
 * Save a calculator snapshot (inputs + results) for a token.
 */
export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return errorResponse("Invalid origin", 403);
  }

  const ip = getClientIp(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON");
  }

  const parsed = SnapshotRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid snapshot data");
  }

  const { token_id, session_id, input_state, output_results, client_version } =
    parsed.data;

  // Rate limit: reuse events rate limit (100 per token per minute)
  const rateLimitKey = `snapshots:${token_id}:${ip}`;
  const rateCheck = checkRateLimit(
    rateLimitKey,
    RATE_LIMITS.events.limit,
    RATE_LIMITS.events.windowMs
  );

  if (!rateCheck.allowed) {
    return errorResponse("Too many requests", 429);
  }

  try {
    const snapshot = await saveSnapshot({
      tokenId: token_id,
      sessionId: session_id,
      inputState: input_state as unknown as Record<string, unknown>,
      outputResults: output_results,
      clientVersion: client_version,
    });

    return successResponse({ saved: true, id: snapshot?.id ?? null });
  } catch (error) {
    console.error("Snapshot save failed:", error);
    return errorResponse("Failed to save snapshot", 500);
  }
}
