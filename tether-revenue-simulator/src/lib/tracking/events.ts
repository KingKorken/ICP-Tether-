import { z } from "zod";

/**
 * Event type constants — prevents string typos.
 */
export const EVENTS = {
  LEAD_CREATED: "lead.created",
  SESSION_STARTED: "session.started",
  SESSION_ENDED: "session.ended",
  INPUT_CHANGED: "input.changed",
  METHODOLOGY_EXPANDED: "methodology.expanded",
  PDF_EXPORTED: "pdf.exported",
  CONTACT_SALES_CLICKED: "contact-sales.clicked",
  SNAPSHOT_SAVED: "snapshot.saved",
} as const;

export type EventType = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * All valid event types as a set for validation.
 */
export const VALID_EVENT_TYPES = new Set<string>(Object.values(EVENTS));

/**
 * Discriminated union for event payloads.
 * Each event type has a strictly typed payload.
 */
export type TrackedEvent =
  | {
      type: typeof EVENTS.LEAD_CREATED;
      payload: { email: string; company: string };
    }
  | {
      type: typeof EVENTS.SESSION_STARTED;
      payload: { referrer: string; device_type: string };
    }
  | {
      type: typeof EVENTS.SESSION_ENDED;
      payload: { duration_seconds: number };
    }
  | {
      type: typeof EVENTS.INPUT_CHANGED;
      payload: { field: string; old_value: string; new_value: string };
    }
  | {
      type: typeof EVENTS.METHODOLOGY_EXPANDED;
      payload: Record<string, never>;
    }
  | {
      type: typeof EVENTS.PDF_EXPORTED;
      payload: { snapshot_id: string };
    }
  | {
      type: typeof EVENTS.CONTACT_SALES_CLICKED;
      payload: Record<string, never>;
    }
  | {
      type: typeof EVENTS.SNAPSHOT_SAVED;
      payload: { snapshot_id: string };
    };

/**
 * Zod schema for validating individual event payloads.
 */
const inputChangedPayloadSchema = z.object({
  field: z.string().max(50),
  old_value: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.string().max(100)),
  new_value: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.string().max(100)),
});

const sessionStartedPayloadSchema = z.object({
  referrer: z.string().max(500).default(""),
  device_type: z.string().max(20).default("unknown"),
});

const sessionEndedPayloadSchema = z.object({
  duration_seconds: z.number().int().min(0).max(86400),
});

const pdfExportedPayloadSchema = z.object({
  snapshot_id: z.string().uuid(),
});

const snapshotSavedPayloadSchema = z.object({
  snapshot_id: z.string().uuid(),
});

const emptyPayloadSchema = z.object({}).strict();

/**
 * Validate an event payload based on its type.
 * Returns the validated payload or null if invalid.
 */
export function validateEventPayload(
  eventType: string,
  payload: unknown
): Record<string, unknown> | null {
  try {
    switch (eventType) {
      case EVENTS.INPUT_CHANGED:
        return inputChangedPayloadSchema.parse(payload);
      case EVENTS.SESSION_STARTED:
        return sessionStartedPayloadSchema.parse(payload);
      case EVENTS.SESSION_ENDED:
        return sessionEndedPayloadSchema.parse(payload);
      case EVENTS.PDF_EXPORTED:
        return pdfExportedPayloadSchema.parse(payload);
      case EVENTS.SNAPSHOT_SAVED:
        return snapshotSavedPayloadSchema.parse(payload);
      case EVENTS.METHODOLOGY_EXPANDED:
      case EVENTS.CONTACT_SALES_CLICKED:
        return emptyPayloadSchema.parse(payload) as Record<string, unknown>;
      case EVENTS.LEAD_CREATED:
        return z
          .object({ email: z.string().max(254), company: z.string().max(200) })
          .parse(payload);
      default:
        return null; // Unknown event type
    }
  } catch {
    return null;
  }
}

/**
 * Zod schema for a batch of events from the client.
 */
export const EventBatchSchema = z.object({
  events: z
    .array(
      z.object({
        event_type: z.string().max(50),
        payload: z.record(z.unknown()).default({}),
        client_sequence: z.number().int().min(0).optional(),
        client_timestamp: z.string().datetime().optional(),
      })
    )
    .min(1)
    .max(100),
  session_id: z.string().uuid(),
  token_id: z.string().uuid(),
});

export type EventBatch = z.infer<typeof EventBatchSchema>;
