import crypto from "crypto";

/**
 * Generate a high-entropy verification code for magic links.
 * Uses crypto.randomBytes(32) for 256-bit entropy.
 * NOT a short numeric code — prevents brute-force attacks.
 */
export function generateVerificationCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Get expiry timestamp for a verification code (15 minutes from now).
 */
export function getVerificationCodeExpiry(): string {
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  return expiry.toISOString();
}

/**
 * Build the magic link URL from a verification code.
 */
export function buildMagicLinkUrl(code: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl}/verify?code=${encodeURIComponent(code)}`;
}

/**
 * Build the calculator URL from an access token.
 */
export function buildCalculatorUrl(accessToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl}/sim/t/${accessToken}`;
}
