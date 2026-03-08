import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLinkCode, verifyLead, touchToken } from "@/lib/db/queries";
import { isValidVerificationCode } from "@/lib/tokens/validation";
import { buildCalculatorUrl } from "@/lib/tokens/generator";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code || !isValidVerificationCode(code)) {
    return NextResponse.redirect(
      new URL("/?error=invalid-code", request.url)
    );
  }

  try {
    // Validate the verification code against DB
    const token = await verifyMagicLinkCode(code);

    if (!token) {
      return NextResponse.redirect(
        new URL("/?error=expired-code", request.url)
      );
    }

    // Mark the lead as verified
    await verifyLead(token.lead_id);

    // Update last used timestamp
    await touchToken(token.id);

    // Set session cookie
    const session = await getSession();
    session.accessToken = token.token;
    session.tokenId = token.id;
    session.leadId = token.lead_id;
    session.isVerified = true;
    await session.save();

    // Redirect to the calculator
    const calculatorUrl = buildCalculatorUrl(token.token);
    return NextResponse.redirect(new URL(calculatorUrl));
  } catch (error) {
    console.error("Verification failed:", error);
    return NextResponse.redirect(
      new URL("/?error=verification-failed", request.url)
    );
  }
}
