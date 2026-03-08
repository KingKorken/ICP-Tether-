import { z } from "zod";

/**
 * Validate that a string is a valid UUID v4 format (for access tokens).
 */
export const accessTokenSchema = z
  .string()
  .uuid("Invalid access token format");

/**
 * Validate a verification code format (64-char hex string).
 */
export const verificationCodeSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/, "Invalid verification code format");

/**
 * Check if an access token has a valid format.
 */
export function isValidAccessToken(token: string): boolean {
  return accessTokenSchema.safeParse(token).success;
}

/**
 * Check if a verification code has a valid format.
 */
export function isValidVerificationCode(code: string): boolean {
  return verificationCodeSchema.safeParse(code).success;
}
