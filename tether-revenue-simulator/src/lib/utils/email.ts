import { z } from "zod";

/**
 * Email validation schema with Zod.
 */
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(254, "Email too long")
  .transform((e) => e.toLowerCase().trim());

/**
 * List of common free email providers.
 * Used to flag personal vs business emails for lead qualification.
 */
const FREE_EMAIL_PROVIDERS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "mail.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "yandex.com",
  "gmx.com",
  "gmx.de",
  "web.de",
  "t-online.de",
  "fastmail.com",
  "tutanota.com",
  "mailinator.com",
]);

/**
 * Check if an email is from a free email provider.
 */
export function isFreeEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? FREE_EMAIL_PROVIDERS.has(domain) : false;
}

/**
 * Extract domain from email address.
 */
export function getEmailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}
