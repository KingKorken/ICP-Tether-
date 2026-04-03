import { NextRequest } from "next/server";
import { z } from "zod";
import { renderToBuffer } from "@react-pdf/renderer";
import { getActiveToken, getLatestSnapshot } from "@/lib/db/queries";
import { calculateRevenue } from "@/lib/calculator/engine";
import { RevenueReport } from "@/components/pdf/RevenueReport";
import { SimulatorStateSchema } from "@/lib/calculator/types";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  validateOrigin,
  getClientIp,
  errorResponse,
} from "@/lib/api-utils";
import React from "react";

const pdfRequestSchema = z.object({
  token: z.string().uuid(),
});

/**
 * POST /api/reports/pdf
 * Generate a branded 2-page PDF revenue report.
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
    const token = await getActiveToken(body.token);
    if (!token) {
      return errorResponse("Invalid or inactive token", 404);
    }

    const snapshot = await getLatestSnapshot(token.id);
    if (!snapshot) {
      return errorResponse("No calculator data found. Please calculate revenue first.", 404);
    }

    const stateResult = SimulatorStateSchema.safeParse(snapshot.input_state);
    if (!stateResult.success) {
      return errorResponse("Invalid calculator data", 400);
    }

    const state = stateResult.data;
    const results = calculateRevenue(state);
    const companyName =
      (snapshot.input_state as Record<string, unknown>)?.company as string ||
      (token.leads as { company_name?: string })?.company_name ||
      "";

    // Generate PDF buffer
    const reportElement = React.createElement(RevenueReport, {
      state,
      results,
      companyName,
    });
    const pdfBuffer = await (renderToBuffer as (node: React.ReactElement) => Promise<Buffer>)(reportElement);

    const safeName = companyName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase() || "report";

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="tether-revenue-report-${safeName}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return errorResponse("Failed to generate PDF report", 500);
  }
}
