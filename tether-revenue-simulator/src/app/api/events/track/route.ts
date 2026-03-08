import { NextRequest } from "next/server";
import {
  EventBatchSchema,
  VALID_EVENT_TYPES,
  validateEventPayload,
} from "@/lib/tracking/events";
import { insertEvents } from "@/lib/db/queries";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  validateOrigin,
  getClientIp,
  errorResponse,
  successResponse,
} from "@/lib/api-utils";

/**
 * POST /api/events/track
 * Batch event ingestion endpoint.
 * Max payload: 50 KB. Max 100 events per batch.
 */
export async function POST(request: NextRequest) {
  // CSRF check
  if (!validateOrigin(request)) {
    return errorResponse("Invalid origin", 403);
  }

  // Check content length (50 KB max)
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 50 * 1024) {
    return errorResponse("Payload too large. Max 50KB per batch.", 413);
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON");
  }

  // Validate batch structure
  const parsed = EventBatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid event batch format");
  }

  const { events, session_id, token_id } = parsed.data;

  // Rate limiting per token
  const ip = getClientIp(request);
  const rateLimitKey = `events:${token_id}:${ip}`;
  const rateCheck = checkRateLimit(
    rateLimitKey,
    RATE_LIMITS.events.limit,
    RATE_LIMITS.events.windowMs
  );

  if (!rateCheck.allowed) {
    // Silent 429 for event tracking — don't break the user experience
    return successResponse({ accepted: 0, message: "Rate limited" }, 429);
  }

  // Validate and filter events
  const validEvents = events
    .filter((e) => VALID_EVENT_TYPES.has(e.event_type))
    .map((e) => {
      const validatedPayload = validateEventPayload(
        e.event_type,
        e.payload
      );
      return {
        token_id,
        session_id,
        event_type: e.event_type,
        payload: validatedPayload ?? {},
        client_sequence: e.client_sequence,
        client_timestamp: e.client_timestamp,
      };
    });

  if (validEvents.length === 0) {
    return successResponse({ accepted: 0 });
  }

  try {
    await insertEvents(validEvents);
    return successResponse({ accepted: validEvents.length });
  } catch (error) {
    console.error("Event tracking failed:", error);
    // Silent failure — never break the user experience for analytics
    return successResponse({ accepted: 0 });
  }
}
