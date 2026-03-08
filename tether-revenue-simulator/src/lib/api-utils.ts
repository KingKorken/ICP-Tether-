import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, type RateLimitResult } from "./rate-limit";

/**
 * Validate Origin header for CSRF protection on POST requests.
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!origin) {
    // Allow requests without Origin (e.g., sendBeacon from same origin)
    return true;
  }

  try {
    const originHost = new URL(origin).host;
    const appHost = new URL(appUrl).host;
    return originHost === appHost;
  } catch {
    return false;
  }
}

/**
 * Apply rate limiting and return appropriate response if exceeded.
 */
export function applyRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { result: RateLimitResult; response?: NextResponse } {
  const result = checkRateLimit(key, limit, windowMs);

  if (!result.allowed) {
    return {
      result,
      response: NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(result.retryAfter ?? 60),
            "X-RateLimit-Remaining": "0",
          },
        }
      ),
    };
  }

  return { result };
}

/**
 * Get client IP from request headers.
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Standard error response.
 */
export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Standard success response.
 */
export function successResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
