"use client";

import type { TrackedEvent } from "./events";

/**
 * Client-side event batcher.
 * Module-level singleton with idempotent start/stop (React strict mode safe).
 *
 * Batches events every 5 seconds, with special handling for:
 * - visibilitychange: flushes via sendBeacon (fetch can be cancelled)
 * - Component unmount: flushes pending events
 */

interface BatcherConfig {
  tokenId: string;
  sessionId: string;
  flushIntervalMs?: number;
}

let queue: Array<{
  event_type: string;
  payload: Record<string, unknown>;
  client_sequence: number;
  client_timestamp: string;
}> = [];

let sequenceCounter = 0;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let config: BatcherConfig | null = null;
let isStarted = false;

/**
 * Start the event batcher. Idempotent — safe to call multiple times.
 */
export function startBatcher(batcherConfig: BatcherConfig): void {
  if (isStarted) return;

  config = batcherConfig;
  isStarted = true;
  sequenceCounter = 0;
  queue = [];

  const interval = config.flushIntervalMs ?? 5000;
  flushTimer = setInterval(flushQueue, interval);

  // Flush on page visibility change (user navigating away)
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }
}

/**
 * Stop the event batcher and flush remaining events.
 */
export function stopBatcher(): void {
  if (!isStarted) return;

  isStarted = false;

  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }

  if (typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }

  // Final flush
  flushQueue();
}

/**
 * Track an event. Adds to queue and will be sent in next batch.
 */
export function trackEvent(event: TrackedEvent): void {
  if (!isStarted || !config) return;

  sequenceCounter++;
  queue.push({
    event_type: event.type,
    payload: event.payload as Record<string, unknown>,
    client_sequence: sequenceCounter,
    client_timestamp: new Date().toISOString(),
  });
}

/**
 * Flush all pending events immediately.
 * Called by the interval timer, visibility change, and stop.
 */
function flushQueue(): void {
  if (queue.length === 0 || !config) return;

  const batch = [...queue];
  queue = [];

  const body = JSON.stringify({
    events: batch,
    session_id: config.sessionId,
    token_id: config.tokenId,
  });

  // Use sendBeacon if page is hidden (more reliable than fetch during unload)
  if (
    typeof document !== "undefined" &&
    document.visibilityState === "hidden" &&
    typeof navigator.sendBeacon === "function"
  ) {
    navigator.sendBeacon("/api/events/track", body);
    return;
  }

  // Normal fetch for active page
  fetch("/api/events/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true, // Keeps request alive even if page navigates
  }).catch(() => {
    // Silent failure — event tracking should never block the user
  });
}

/**
 * Handle visibility change — flush immediately via sendBeacon.
 */
function handleVisibilityChange(): void {
  if (document.visibilityState === "hidden") {
    flushQueue();
  }
}

/**
 * Get the current sequence counter (for debugging/testing).
 */
export function getSequenceCounter(): number {
  return sequenceCounter;
}
