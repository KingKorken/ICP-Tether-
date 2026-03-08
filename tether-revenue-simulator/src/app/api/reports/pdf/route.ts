import { NextRequest } from "next/server";
import { z } from "zod";
import { getActiveToken, getLatestSnapshot } from "@/lib/db/queries";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  validateOrigin,
  getClientIp,
  errorResponse,
} from "@/lib/api-utils";

const pdfRequestSchema = z.object({
  token: z.string().uuid(),
});

/**
 * POST /api/reports/pdf
 * Generate a PDF revenue report for a given token.
 * TODO: Implement actual PDF generation with @react-pdf/renderer
 */
export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return errorResponse("Invalid origin", 403);
  }

  let body: z.infer<typeof pdfRequestSchema>;
  try {
    const raw = await request.json();
    body = pdfRequestSchema.parse(raw);
  } catch {
    return errorResponse("Invalid request body");
  }

  // Rate limiting
  const ip = getClientIp(request);
  const rateLimitKey = `pdf:${body.token}:${ip}`;
  const rateCheck = checkRateLimit(
    rateLimitKey,
    RATE_LIMITS.pdfExport.limit,
    RATE_LIMITS.pdfExport.windowMs
  );

  if (!rateCheck.allowed) {
    return errorResponse("Too many export requests. Please try again later.", 429);
  }

  try {
    // Validate token
    const token = await getActiveToken(body.token);
    if (!token) {
      return errorResponse("Invalid or inactive token", 404);
    }

    // Get latest snapshot
    const snapshot = await getLatestSnapshot(token.id);
    if (!snapshot) {
      return errorResponse("No calculator data found. Please use the calculator first.", 404);
    }

    // TODO: Generate PDF with @react-pdf/renderer
    // For now, return the snapshot data
    return new Response(
      JSON.stringify({
        message: "PDF generation not yet implemented",
        snapshot: {
          inputState: snapshot.input_state,
          outputResults: snapshot.output_results,
          createdAt: snapshot.created_at,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("PDF generation failed:", error);
    return errorResponse("Failed to generate PDF", 500);
  }
}
