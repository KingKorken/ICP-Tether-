/**
 * Format a number as EUR currency.
 */
export function formatEur(value: number): string {
  return `EUR ${Math.round(value).toLocaleString("en-US")}`;
}

/**
 * Format a number with thousand separators.
 */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

/**
 * Format a percentage value.
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Sanitize company name (removes potentially dangerous characters).
 */
export function sanitizeCompanyName(name: string): string {
  return name.trim().replace(/[<>"'&/\\]/g, "").substring(0, 200);
}

/**
 * Create a safe filename from a company name.
 */
export function safeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 50);
}
