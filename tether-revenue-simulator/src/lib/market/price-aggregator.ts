/**
 * Price Aggregator
 *
 * Groups hourly ENTSO-E prices by calendar month and computes
 * simple arithmetic monthly averages. Returns a 12-element array
 * indexed 0-11 (Jan=0, Dec=11) matching the engine's expected format.
 */

import type { HourlyPrice } from "./entsoe-client";

/**
 * Aggregate hourly prices into monthly averages.
 *
 * @param prices - Array of hourly prices from ENTSO-E
 * @returns 12-element array of monthly averages (index 0 = January, 11 = December).
 *          Months with no data get null.
 */
export function aggregateToMonthly(prices: HourlyPrice[]): (number | null)[] {
  // Buckets: sum and count per month (0-11)
  const sums = new Array(12).fill(0);
  const counts = new Array(12).fill(0);

  for (const { timestamp, price } of prices) {
    const monthIndex = timestamp.getUTCMonth(); // 0-11
    sums[monthIndex] += price;
    counts[monthIndex] += 1;
  }

  return sums.map((sum, i) => {
    if (counts[i] === 0) return null;
    return sum / counts[i];
  });
}

/**
 * Fill null months with the nearest available month's value,
 * then floor negative values to 0.
 *
 * Strategy:
 * 1. If a month has data, use it
 * 2. If a month is null, use the overall average of non-null months
 * 3. If all months are null, return all zeros
 * 4. Floor negative averages to 0
 *
 * @returns 12-element array with no nulls
 */
export function fillAndFloor(monthly: (number | null)[]): number[] {
  const nonNull = monthly.filter((v): v is number => v !== null);

  if (nonNull.length === 0) {
    return new Array(12).fill(0);
  }

  const overallAvg = nonNull.reduce((a, b) => a + b, 0) / nonNull.length;

  return monthly.map((v) => {
    const value = v ?? overallAvg;
    return Math.max(0, value);
  });
}

/**
 * Get the sample counts per month (for storing in DB).
 */
export function getSampleCounts(prices: HourlyPrice[]): number[] {
  const counts = new Array(12).fill(0);
  for (const { timestamp } of prices) {
    counts[timestamp.getUTCMonth()] += 1;
  }
  return counts;
}
