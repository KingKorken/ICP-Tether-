---
title: "feat: Build Tether Revenue Simulator Product"
type: feat
status: active
date: 2026-03-08
deepened: 2026-03-08
origin: docs/brainstorms/2026-03-08-tether-revenue-simulator-product-brainstorm.md
---

# feat: Build Tether Revenue Simulator Product

## Enhancement Summary

**Deepened on:** 2026-03-08
**Research agents used:** 10 (security-sentinel, performance-oracle, architecture-strategist, kieran-typescript-reviewer, julik-frontend-races-reviewer, code-simplicity-reviewer, data-integrity-guardian, pattern-recognition-specialist, best-practices-researcher, spec-flow-analyzer)
**Framework docs queried:** Supabase, iron-session, recharts-to-png, Resend, Recharts, Next.js App Router

### Key Improvements Found

1. **CRITICAL Security:** Enable Supabase RLS on all tables immediately — without it, the anon key exposes all data. Add verification code expiry (15min) with attempt limiting to prevent brute-force.
2. **CRITICAL Race Conditions:** 4 high-severity frontend race conditions identified with concrete fixes (debounced save vs navigation, overlapping saves, PDF export with stale state, returning user state loading).
3. **Scope Reduction Opportunity:** Simplicity review found 40-50% LOC reduction possible — could ship in 2 weeks instead of 4 by cutting sessions table, engagement scoring, and using browser print instead of @react-pdf/renderer.
4. **Database Integrity:** Missing NOT NULL constraints, CHECK constraints, CASCADE rules, and indexes. Full SQL provided.
5. **GDPR Gaps:** 6 missing requirements (right to erasure implementation, data retention policy, DPA with Supabase, DSAR workflow, cross-border transfer, data breach notification).
6. **Pattern Consistency:** Event type `contact_sales.clicked` breaks the naming convention — standardize to kebab-case entities.

### New Considerations Discovered

- Verification codes need 128-bit entropy + 15-minute expiry + max 5 attempts (not short numeric codes)
- `navigator.sendBeacon()` required for visibilitychange event flushing (fetch can be cancelled)
- `useDeferredValue` for slider performance (calculation in render path blocks at 60fps)
- iron-session `cookies()` is async in Next.js 15+ — confirmed via Context7 docs
- recharts-to-png `useCurrentPng` hook needs `isAnimationActive={false}` on charts before capture
- Supabase Storage bucket for PDFs must be configured as PRIVATE (not public)

---

## Overview

Transform the existing Revenue Simulator HTML prototype into a production standalone web application for Tether. The product serves as a lead-magnet tool that shows EV Charge Point Operators (CPOs) their potential revenue from Tether's two revenue streams (e-credits + grid flexibility), while capturing structured data on every interaction for sales intelligence and market research.

The application has three pillars: (1) an interactive calculator for CPOs, (2) a tokenised access system with magic-link email verification, and (3) a data & intelligence layer powering an admin dashboard for Tether's sales and leadership teams (see brainstorm: `docs/brainstorms/2026-03-08-tether-revenue-simulator-product-brainstorm.md`).

## Problem Statement

Tether needs to convert CPO prospects into customers. The current approach relies on static presentations and manual outreach. There is no scalable mechanism to:

1. **Demonstrate value** — CPOs are skeptical of startup revenue projections (industry research finding). A transparent, interactive calculator builds trust.
2. **Capture lead data** — No systematic way to identify interested CPOs, their fleet sizes, countries, or engagement levels.
3. **Prioritize sales effort** — Without engagement signals, the sales team treats all prospects equally.
4. **Understand the market** — No aggregate data on CPO fleet compositions, utilization rates, or geographic distribution.

The existing Revenue Simulator HTML prototype (`Concept - The Revenue Simulator.html`) has a proven calculation engine, interactive inputs, and visualizations. It needs to be productized with authentication, data persistence, analytics, and an admin interface.

## Proposed Solution

A Next.js application with Supabase backend, deployed as a standalone web app. Two distinct user experiences:

**CPO-facing:** Landing page → magic-link email verification → tokenised calculator access → PDF export → Contact Sales CTA.

**Tether-facing:** Admin dashboard with two views — sales (lead scoring, engagement signals, pipeline) and leadership (aggregate market intelligence, fleet distributions).

---

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                     │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  (public)     │  │  (simulator) │  │  (admin)       │ │
│  │  Landing page │  │  Calculator  │  │  Dashboard     │ │
│  │  Email gate   │  │  Results     │  │  Lead list     │ │
│  │  Magic link   │  │  Charts      │  │  Analytics     │ │
│  │  verify       │  │  PDF export  │  │  Data export   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬─────────┘ │
│         │                  │                  │           │
│  ┌──────┴──────────────────┴──────────────────┴─────────┐│
│  │              Next.js API Routes (/api)                ││
│  │  /api/auth/request-link   POST email→magic link      ││
│  │  /api/auth/verify         GET  verify magic link     ││
│  │  /api/tokens/create       POST admin creates token   ││
│  │  /api/events/track        POST batch event ingestion ││
│  │  /api/reports/pdf         POST generate PDF          ││
│  │  /api/admin/leads         GET  lead list + scores    ││
│  │  /api/admin/analytics     GET  aggregate metrics     ││
│  │  /api/admin/export        GET  CSV export            ││
│  └──────────────────────┬───────────────────────────────┘│
└─────────────────────────┼────────────────────────────────┘
                          │
                ┌─────────┴──────────┐
                │   Supabase         │
                │                    │
                │  ┌──────────────┐  │
                │  │  Postgres DB │  │
                │  │  - leads     │  │
                │  │  - tokens    │  │
                │  │  - sessions  │  │
                │  │  - events    │  │
                │  │  - snapshots │  │
                │  │  - admins    │  │
                │  └──────────────┘  │
                │                    │
                │  ┌──────────────┐  │
                │  │  Auth        │  │
                │  │  (admin only)│  │
                │  └──────────────┘  │
                │                    │
                │  ┌──────────────┐  │
                │  │  Storage     │  │
                │  │  (PDFs)      │  │
                │  └──────────────┘  │
                └────────────────────┘
```

**Key architectural decisions (see brainstorm):**
- Next.js App Router with route groups: `(public)`, `(simulator)`, `(admin)`
- Supabase for database, admin auth, and file storage (PDFs)
- CPO auth is custom (magic-link verification + URL access tokens), NOT Supabase Auth — simpler, no password, bookmarkable URLs
- **Token terminology:** Three distinct tokens exist in this system:
  - **Magic link code** (`verification_code`): one-time code sent via email, expires after use. Used in `/api/auth/verify?code=xxx`.
  - **Access token** (`access_token`): persistent UUIDv4 identifier in the calculator URL (`/sim/t/{access_token}`). Never expires. This is what CPOs bookmark.
  - **Session cookie**: `httpOnly` cookie set after magic link verification, maps browser to access token for return visits.
- Admin auth uses Supabase Auth (email/password for Tether team members)
- Event tracking: client-side batching → `POST /api/events/track` → Supabase insert
- PDF generation: server-side using `@react-pdf/renderer` for consistent branded output

### Research Insights: Architecture

**Best Practices (from architecture-strategist + best-practices-researcher):**

- **Custom CPO auth is the correct call.** Supabase Auth is designed for authenticated users who return with credentials. CPOs have no credentials — they have bookmarkable URLs. Bridging iron-session with Supabase Auth would add complexity for no benefit. Reserve Supabase Auth exclusively for admin.
- **CPO leads should NEVER interact with Supabase directly.** All data flows through Next.js API routes using the `service_role` client. This means the Supabase anon key need not be exposed to the client at all.
- **Separate Supabase client factories are required:**
  ```typescript
  // src/lib/db/supabase.ts
  export const createServerClient = () => { /* uses service_role key */ }
  export const createBrowserClient = () => { /* uses anon key, if needed */ }
  ```
  A single shared client is an anti-pattern because server and client contexts have different security requirements.
- **Middleware for token validation is correct** for Next.js App Router. The middleware runs on the Edge and can validate tokens before the page renders.
- **JSONB payloads for events are a good extensibility choice** — new event types can be added without schema migrations.

**Anti-Pattern Warnings:**
- **engine.ts God Module risk:** Split calculation engine by phase: `normalize.ts`, `seasonal.ts`, `cumulative.ts`, with `engine.ts` as orchestrator only.
- **utils/ Junk Drawer:** Define `utils/` as "pure functions with zero domain knowledge." Domain-aware formatting belongs in `calculator/`, not `utils/`.
- **Layer violations to enforce:** Components must NOT import from `src/lib/db/` directly. Calculation engine must NOT import from `src/lib/db/`. API routes should delegate to library modules, not contain business logic.

---

### Research Insights: Security (CRITICAL)

**Security sentinel identified 5 CRITICAL, 7 HIGH, and 6 MEDIUM findings. Key ones:**

**CRITICAL — Enable RLS on ALL Supabase tables (before any production traffic):**
```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Block all direct anon access (everything goes through API routes with service_role)
CREATE POLICY "No anon access" ON leads FOR ALL USING (false);
-- Repeat for all tables
```
Without RLS, anyone with the Supabase anon key (embedded in client bundles by default) can query ALL tables via the PostgREST API. This is a complete data breach risk.

**CRITICAL — Verification code must use high entropy + time expiry + attempt limiting:**
```typescript
// Use crypto.randomBytes, NOT short numeric codes
const verificationCode = crypto.randomBytes(32).toString('hex'); // 256-bit
// Add to tokens table:
// verification_code_expires_at: TIMESTAMPTZ (15 minutes from creation)
// verification_attempts: INT DEFAULT 0 (max 5, then invalidate)
```

**CRITICAL — Add CSRF protection:**
- Set `SameSite=Lax` on session cookies (iron-session default)
- Validate `Origin` header on all POST API routes
- iron-session recommended configuration:
  ```typescript
  {
    password: process.env.SESSION_SECRET, // min 32 chars
    cookieName: 'tether_sim_session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  }
  ```

**HIGH — JSONB event payloads need server-side Zod validation:**
```typescript
const inputChangedSchema = z.object({
  field: z.enum(['chargers', 'country', 'type', 'power', 'utilization', 'flexibility']),
  old_value: z.union([z.string(), z.number()]).pipe(z.coerce.string().max(100)),
  new_value: z.union([z.string(), z.number()]).pipe(z.coerce.string().max(100)),
});
// Enforce max payload size: 1 KB per event, 50 KB per batch
```

**HIGH — Security headers in next.config.ts:**
```typescript
headers: async () => [
  {
    source: '/(.*)',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  },
],
```

**HIGH — Supabase Storage (PDFs) must be PRIVATE bucket.** Serve PDFs through API routes that validate admin auth or token ownership. Use signed URLs with 5-minute expiry if serving from storage directly.

**HIGH — Company name sanitization (flows into PDF filename + admin dashboard):**
```typescript
const sanitizeCompanyName = (name: string): string =>
  name.trim().replace(/[<>"'&\/\\]/g, '').substring(0, 200);

const safeFileName = (name: string): string =>
  name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').substring(0, 50);
```

**HIGH — Add admin audit log:**
```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**OWASP Top 10 Status:** A01 (Broken Access Control) NON-COMPLIANT without RLS. A03 (Injection) AT RISK without JSONB validation. A09 (Logging/Monitoring) NON-COMPLIANT without audit log.

**Full remediation roadmap:** 6 items before any production traffic, 6 before launch, 5 for GDPR compliance. See security review output for complete details.

---

### Research Insights: Race Conditions (HIGH SEVERITY)

**Frontend races reviewer identified 10 race conditions, 4 high-severity:**

**HIGH — Debounced save vs user navigating away:**
- useEffect cleanup function runs on Next.js client-side navigation — flush pending saves there
- Use `navigator.sendBeacon()` for the unload case (fetch can be cancelled by browser)
- On visibilitychange: force-resolve ALL pending debounced events BEFORE flushing the queue
```javascript
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    flushAllPendingDebounces(); // resolve all debounces immediately
    sendBatchViaSendBeacon();   // sendBeacon, NOT fetch
  }
});
```

**HIGH — Overlapping saves with stale data:**
- Use monotonically increasing version counter on client
- Server-side: `UPDATE ... WHERE client_version < $new_version` (last-write-wins with version guard)
- This prevents an older save from overwriting a newer one if saves overlap

**HIGH — PDF export with unsaved state:**
- Force a synchronous save BEFORE initiating PDF export
- Disable "Download Report" button while saving
- Wait for any in-flight save to complete before requesting PDF

**HIGH — Return visit: loading saved state while user starts interacting:**
- Implement proper loading state machine: LOADING → READY → ERROR
- Show skeleton screen (not spinner) that PREVENTS interaction until state is loaded
- Use `canceled` flag in useEffect to prevent stale fetch responses setting state on unmounted components

**MEDIUM — useMemo blocks render at 60fps:**
- Use `useDeferredValue` for calculator inputs → results:
  ```javascript
  const [inputs, setInputs] = useState(initialInputs);
  const deferredInputs = useDeferredValue(inputs);
  const results = useMemo(() => calculateRevenue(deferredInputs), [deferredInputs]);
  ```
  Sliders move smoothly; numbers catch up a frame later.

**MEDIUM — 5-second batch interval + component lifecycle:**
- Make event batcher a module-level singleton with idempotent `startBatcher()`/`stopBatcher()`
- Prevents double-starting from React strict mode double-invoking effects

---

### Research Insights: Performance

**Performance oracle recommendations:**

- **Database indexes (MUST ADD):**
  ```sql
  CREATE INDEX idx_tokens_active_lookup ON tokens (token) WHERE is_active = true;
  CREATE INDEX idx_tokens_lead_active ON tokens (lead_id) WHERE is_active = true;
  CREATE INDEX idx_sessions_token_started ON sessions (token_id, started_at DESC);
  CREATE INDEX idx_sessions_orphaned ON sessions (started_at) WHERE ended_at IS NULL;
  CREATE INDEX idx_events_session_created ON events (session_id, created_at);
  CREATE INDEX idx_events_token_type ON events (token_id, event_type);
  CREATE INDEX idx_snapshots_session ON snapshots (session_id, created_at DESC);
  CREATE INDEX idx_contact_requests_unhandled ON contact_requests (created_at DESC) WHERE is_handled = false;
  CREATE INDEX idx_leads_email_domain ON leads (email_domain);
  ```

- **Engagement scoring:** For MVP with <50 leads, compute on-the-fly. Precomputed scores are premature optimization. Use a simple sorted query by `last_visit_at` with boolean flags (PDF exported, Contact Sales clicked) rather than a weighted algorithm.

- **Events table growth:** With ~100 events/session and potentially thousands of sessions, this table grows fast. Add a data retention policy (archive events older than 12 months) and use `BRIN` index on `created_at` for time-range queries.

- **Rate limiting implementation:** Use in-memory sliding window counter. Adequate for single-instance/Vercel serverless. Each cold start resets counters, which is acceptable for MVP. Graduate to Upstash Redis if needed.

- **PDF generation on Vercel:** Serverless functions have 1GB memory limit and 10-second timeout on hobby plan. Monitor PDF render times. Consider streaming response for large PDFs.

---

### Research Insights: Data Integrity

**Data integrity guardian found CRITICAL missing constraints:**

**Duplicate email race condition — use atomic upsert:**
```sql
INSERT INTO leads (id, email, company_name, email_domain, is_free_email, created_at)
VALUES (gen_random_uuid(), $1, $2, split_part($1, '@', 2), $3, now())
ON CONFLICT (email) DO UPDATE
  SET last_visit_at = now(), total_visits = leads.total_visits + 1
RETURNING id, email, created_at;
```

**Foreign key CASCADE rules (for GDPR right-to-erasure):**
```sql
ALTER TABLE tokens ADD CONSTRAINT tokens_lead_id_fk
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD CONSTRAINT sessions_token_id_fk
  FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE;
ALTER TABLE events ADD CONSTRAINT events_token_id_fk
  FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE;
ALTER TABLE events ADD CONSTRAINT events_session_id_fk
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;
ALTER TABLE snapshots ADD CONSTRAINT snapshots_token_id_fk
  FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE;
ALTER TABLE contact_requests ADD CONSTRAINT contact_requests_token_id_fk
  FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE;
ALTER TABLE contact_requests ADD CONSTRAINT contact_requests_lead_id_fk
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
```
With these cascades, `DELETE FROM leads WHERE id = $1` removes ALL associated data — single query for GDPR erasure.

**Missing constraints to add:**
```sql
ALTER TABLE leads ALTER COLUMN email SET NOT NULL;
ALTER TABLE leads ADD CONSTRAINT leads_total_visits_non_negative CHECK (total_visits >= 0);
ALTER TABLE leads ADD CONSTRAINT leads_verified_after_created CHECK (verified_at IS NULL OR verified_at >= created_at);
ALTER TABLE tokens ADD CONSTRAINT tokens_origin_valid CHECK (origin IN ('organic', 'sales_generated'));
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_valid CHECK (role IN ('sales', 'leadership', 'admin'));
ALTER TABLE events ADD CONSTRAINT events_type_valid CHECK (event_type IN (...)); -- enumerate all types
```

**Event ordering fix — add client-side sequence number:**
```sql
ALTER TABLE events ADD COLUMN client_sequence integer;
ALTER TABLE events ADD COLUMN client_timestamp timestamptz;
-- client_timestamp = when event actually occurred on client
-- created_at = when inserted into DB
-- client_sequence = monotonically increasing per session
```

**GDPR erasure function:**
```sql
CREATE TABLE gdpr_deletion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  lead_email text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  requested_by uuid REFERENCES admin_users(id),
  tables_affected text[]
);

CREATE OR REPLACE FUNCTION delete_lead_gdpr(target_lead_id uuid, admin_id uuid)
RETURNS void AS $$
DECLARE lead_email text;
BEGIN
  SELECT email INTO lead_email FROM leads WHERE id = target_lead_id;
  IF lead_email IS NULL THEN RAISE EXCEPTION 'Lead not found'; END IF;
  INSERT INTO gdpr_deletion_log (lead_id, lead_email, requested_by, completed_at, tables_affected)
  VALUES (target_lead_id, lead_email, admin_id, now(),
    ARRAY['leads','tokens','sessions','events','snapshots','contact_requests']);
  DELETE FROM leads WHERE id = target_lead_id; -- CASCADE handles rest
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Transaction boundary for lead creation (CRITICAL):**
```sql
BEGIN;
  INSERT INTO leads (...) ON CONFLICT (email) DO UPDATE ... RETURNING id;
  INSERT INTO tokens (lead_id, ...) VALUES (...) RETURNING token;
COMMIT;
-- THEN send email (AFTER commit, never inside transaction)
```
Never send emails inside a transaction. If it rolls back, the email is already sent with a token that doesn't exist.

---

### Research Insights: TypeScript Patterns

**Use discriminated unions for event payloads:**
```typescript
type TrackedEvent =
  | { type: 'lead.created'; payload: { email: string; company: string } }
  | { type: 'input.changed'; payload: { field: string; old_value: string; new_value: string } }
  | { type: 'pdf.exported'; payload: { snapshot_id: string } }
  | { type: 'session.started'; payload: { referrer: string; device_type: string } }
  | { type: 'methodology.expanded'; payload: Record<string, never> }
  // ... etc
```
This provides compile-time safety: `event.type === 'input.changed'` narrows `event.payload` automatically.

**Use Zod for API boundary validation:**
```typescript
import { z } from 'zod';

const SimulatorStateSchema = z.object({
  company: z.string().max(200),
  country: z.enum(['sweden', 'norway', 'germany', 'netherlands', 'france']),
  type: z.enum(['public', 'residential']),
  chargers: z.number().int().min(10).max(10000),
  power: z.number().refine(v => [0.0074, 0.011, 0.022].includes(v)),
  utilization: z.number().min(0.05).max(0.40),
  flexPotential: z.number().min(0.20).max(0.80),
});
```

**Event type constants (prevent string typos):**
```typescript
export const EVENTS = {
  LEAD_CREATED: 'lead.created',
  SESSION_STARTED: 'session.started',
  INPUT_CHANGED: 'input.changed',
  METHODOLOGY_EXPANDED: 'methodology.expanded',
  PDF_EXPORTED: 'pdf.exported',
  CONTACT_SALES_CLICKED: 'contact-sales.clicked', // fixed: kebab-case entity
} as const;
export type EventType = typeof EVENTS[keyof typeof EVENTS];
```

---

### Research Insights: Simplicity (MVP Scope Review)

**Simplicity reviewer found 40-50% LOC reduction possible. Key recommendations:**

| Current Feature | YAGNI? | Recommendation |
|---|---|---|
| `sessions` table | YES | Derive session data from events (session.started/ended already captured) |
| `contact_requests` table | YES | Track as event with payload, or use `mailto:` link |
| Engagement scoring with recency decay | YES | Sort by `last_visit_at`, show boolean flags (PDF exported, CTA clicked) |
| Client-side event batching infrastructure | MAYBE | Individual fetch calls work fine at MVP scale (<100 concurrent users) |
| Lead detail page (`/admin/leads/[id]`) | YES | Sales rep can open the CPO's token URL directly. Defer to v2 |
| KPI cards on admin dashboard | YES | Vanity metrics with <50 leads. A sorted table is sufficient |
| Token management page (`/admin/tokens`) | MOSTLY | Keep "create token" form, defer list/revoke UI to v2 |
| 5 countries at launch | RISKY | Only Sweden has real data. Consider Sweden-first for credibility |

**The simplicity reviewer's verdict:** The brainstorm correctly chose "Token-First MVP" to ship fast. The plan accumulated scope during planning. The core value loop (calculator + email capture + admin lead list) could ship in 2 weeks if simplifications are applied. Every additional feature delays data collection.

**Author's note:** These are recommendations, not mandates. The user chose the current scope during brainstorming. These options are documented here for informed decision-making during implementation.

---

### Research Insights: Pattern Consistency

**Pattern recognition specialist findings:**

- **Event type naming inconsistency:** `contact_sales.clicked` breaks the `{entity}.{verb}` pattern (underscore in entity). Standardize to `contact-sales.clicked` (kebab-case entities, dot separator).
- **Library module naming:** Mix of nouns (`engine.ts`) and verbs (`generate.ts`, `validate.ts`). Standardize on nouns: `generator.ts`, `validation.ts`, `formatter.ts`.
- **API route naming:** Mix of verbs and nouns. Consider restructuring to RESTful noun-based routes where possible.
- **Add `shared/` component directory** for cross-feature UI primitives (Button, Card, Modal).
- **Supabase client:** Must have separate server/browser client factories (confirmed by architecture review).

---

### Research Insights: Best Practices

**Iron-session with Next.js App Router (confirmed via Context7):**
```typescript
// In route handlers:
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session;
}
```
Note: `cookies()` is async in Next.js 15+.

**Resend email deliverability:**
- Verify custom domain in Resend dashboard (SPF + DKIM auto-configured)
- Add DMARC DNS record: start at `p=none`, progress to `p=reject` over 4+ weeks
- Set `X-Entity-Ref-ID` header to prevent Gmail conversation threading
- Use `@react-email/components` for templated magic link emails
- Test with `delivered@resend.dev` in development

**Recharts-to-PNG for PDF (confirmed via Context7):**
```typescript
import { useCurrentPng } from 'recharts-to-png';

const [getPng, { ref, isLoading }] = useCurrentPng({ backgroundColor: '#ffffff' });
// Set isAnimationActive={false} on chart elements BEFORE capture
// Wait 100-200ms after render before calling getPng() if using animations
// The ref goes on the Chart component, NOT ResponsiveContainer
```

**Rate limiting (no external services):**
In-memory sliding window counter with Map-based storage. Adequate for Vercel serverless MVP. Key: combine IP + email/token as identifier. Set `Retry-After` header on 429 responses.

**Recommended dependency versions:**
```json
{
  "next": "^15.1.0",
  "@supabase/supabase-js": "^2.45.0",
  "@supabase/ssr": "^0.5.0",
  "iron-session": "^8.0.0",
  "resend": "^4.0.0",
  "@react-email/components": "^0.0.30",
  "@react-pdf/renderer": "^4.1.0",
  "recharts": "^2.15.0",
  "recharts-to-png": "^2.3.0",
  "zod": "^3.23.0"
}
```

---

### Research Insights: Spec Flow Gaps

**Spec-flow analyzer identified additional edge cases not in the original plan:**

1. **Magic link expiry:** Plan says "expires after first use" but no TIME-BASED expiry. Add 15-minute expiry window.
2. **CPO uses different browser/device:** Session cookie is per-browser. Returning on a different device shows the calculator with defaults, not saved state. Consider showing a "Welcome back" message with option to load last saved state.
3. **Admin creates token for email that already has an organic token:** Plan says leads can have multiple tokens. Verify the admin dashboard shows both tokens and their origin clearly.
4. **Two CPOs from same company with different emails:** Both get separate leads. Admin should be able to group by `email_domain` in v2.
5. **Token revoked while user is active:** Show non-dismissible banner "Your session has expired" — do NOT redirect away (they may want to copy their numbers).
6. **Contact form submitted multiple times:** Rate limit to max 2 per token per day.
7. **Mobile chart interactions:** Recharts hover tooltips don't work on touch. Use click-to-show or persistent labels on mobile.
8. **SEO/social sharing:** Add Open Graph meta tags to the landing page. Calculator pages should have `noindex` (they're gated).
9. **Browser back/forward in calculator:** Calculator is a single page — back navigates away entirely. Consider `beforeunload` warning if unsaved changes exist.
10. **Email bounces:** Set up Resend webhook for `bounced` events and suppress those addresses.

---

## Project Structure

*(Unchanged from original plan — see original for full tree)*

### Research Enhancement: Additional Files

```
tether-revenue-simulator/
├── src/
│   ├── ...existing structure...
│   ├── components/
│   │   ├── shared/                    # NEW: Cross-feature UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   ├── lib/
│   │   ├── calculator/
│   │   │   ├── engine.ts             # Orchestrator only (delegates to modules below)
│   │   │   ├── normalize.ts          # NEW: Input normalization
│   │   │   ├── seasonal.ts           # NEW: Seasonal adjustment logic
│   │   │   ├── cumulative.ts         # NEW: Cumulative calculations
│   │   │   ├── market-data.ts
│   │   │   ├── constants.ts
│   │   │   └── types.ts
│   │   ├── db/
│   │   │   ├── server.ts             # RENAMED: Supabase server client (service_role)
│   │   │   ├── browser.ts            # RENAMED: Supabase browser client (anon)
│   │   │   ├── queries.ts
│   │   │   └── schema.sql
│   │   ├── tokens/
│   │   │   ├── generator.ts          # RENAMED from generate.ts (noun convention)
│   │   │   └── validation.ts         # RENAMED from validate.ts (noun convention)
│   │   ├── utils/
│   │   │   ├── email.ts
│   │   │   └── formatter.ts          # RENAMED from format.ts (noun convention)
│   │   └── rate-limit.ts             # NEW: In-memory sliding window rate limiter
│   ├── emails/                        # NEW: React Email templates
│   │   └── magic-link.tsx
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql       # NEW: Row Level Security
│       ├── 003_indexes.sql            # NEW: Performance indexes
│       └── 004_gdpr_functions.sql     # NEW: GDPR erasure function + audit log
```

---

## Implementation Phases

*(Original phase content preserved. Research insights added as sub-sections.)*

### Phase 1: Foundation (Week 1)

*(Original tasks unchanged — see original plan)*

#### Phase 1 Research Insights

**Security additions for Phase 1:**
- [ ] Enable RLS on ALL tables in initial migration (002_rls_policies.sql)
- [ ] Configure iron-session with full cookie options (secure, httpOnly, sameSite: lax, maxAge: 30 days)
- [ ] Use `crypto.randomBytes(32).toString('hex')` for verification codes (not short numeric)
- [ ] Add 15-minute expiry + max 5 attempts on verification codes
- [ ] Add `SESSION_SECRET` to required env vars with min 32-char validation at startup
- [ ] Add security headers to `next.config.ts`
- [ ] Validate `Origin` header on all POST routes (CSRF prevention)

**Data integrity additions for Phase 1:**
- [ ] Use `INSERT ... ON CONFLICT (email)` for atomic duplicate email handling
- [ ] Add NOT NULL constraints on email, email_domain, created_at
- [ ] Add CHECK constraints for origin, role, preferred_contact columns
- [ ] Define CASCADE rules on all foreign keys
- [ ] Create performance indexes (003_indexes.sql)
- [ ] Never send emails inside database transactions

**Resend setup for magic links:**
- [ ] Verify custom domain in Resend dashboard
- [ ] Add SPF/DKIM/DMARC DNS records (start DMARC at `p=none`)
- [ ] Create `@react-email/components` template for magic link email
- [ ] Set `X-Entity-Ref-ID` header to prevent Gmail threading
- [ ] Test with major email providers (Gmail, Outlook, Yahoo)

---

### Phase 2: Core Calculator (Week 2)

*(Original tasks unchanged — see original plan)*

#### Phase 2 Research Insights

**Race condition fixes for Phase 2:**
- [ ] Implement loading state machine (LOADING → READY → ERROR) for returning user state restoration
- [ ] Show skeleton screen that prevents interaction until saved state loads
- [ ] Use `useDeferredValue` for slider inputs → calculation results (prevents main thread blocking)
- [ ] Add version counter to debounced saves (prevent stale overwrites)
- [ ] Flush pending saves in useEffect cleanup (Next.js navigation) and visibilitychange
- [ ] Use `navigator.sendBeacon()` for unload saves (not fetch)

**Zod validation for calculator state:**
- [ ] Add SimulatorStateSchema with field-level constraints
- [ ] Validate snapshots server-side before storage
- [ ] Sanitize company name on both client and server

**Mobile chart considerations:**
- [ ] Recharts tooltips don't work on touch — use click-to-show or persistent labels
- [ ] Set minimum touch target size of 44px for all interactive elements
- [ ] Test range sliders on iOS Safari and Android Chrome

---

### Phase 3: Event Tracking & Analytics (Week 2-3)

*(Original tasks unchanged — see original plan)*

#### Phase 3 Research Insights

**Event tracking improvements:**
- [ ] Add `client_sequence` (int) and `client_timestamp` (timestamptz) columns to events table for correct ordering of batched events
- [ ] Use typed event constants (`EVENTS.INPUT_CHANGED`) instead of string literals
- [ ] Use discriminated union types for event payloads (compile-time type narrowing)
- [ ] Add server-side Zod validation for each event type's payload shape
- [ ] Enforce max payload size: 1 KB per event, 50 KB per batch
- [ ] Reject unrecognized event types server-side

**Event batcher improvements:**
- [ ] On `visibilitychange`: force-resolve ALL pending debounced events BEFORE flushing
- [ ] Use `navigator.sendBeacon()` in visibilitychange handler (fetch can be cancelled)
- [ ] Make batcher a module-level singleton with idempotent start/stop (React strict mode safe)
- [ ] Add `canceled` flag in useEffect to prevent stale responses

---

### Phase 4: PDF Export (Week 3)

*(Original tasks unchanged — see original plan)*

#### Phase 4 Research Insights

**PDF generation critical path:**
- [ ] Force synchronous save BEFORE initiating PDF export (cancel debounce, await completion)
- [ ] Disable "Download Report" button while saving or exporting
- [ ] Set `isAnimationActive={false}` on all Recharts chart elements before PNG capture
- [ ] Add 100-200ms delay before `getPng()` if charts have animations
- [ ] `useCurrentPng` ref goes on the Chart component, NOT ResponsiveContainer
- [ ] Configure Supabase Storage bucket as PRIVATE for PDF files
- [ ] Use signed URLs with 5-minute expiry for PDF access
- [ ] Sanitize company name in PDF filename: `safeFileName()` removing path-traversal characters

**Alternative approach (simplicity consideration):**
If @react-pdf/renderer proves too complex, fall back to browser print:
- Build a `/sim/t/{token}/report` page with `@media print` CSS
- Recharts renders as SVG (prints natively, no PNG conversion needed)
- Zero server-side dependencies for PDF
- 90% of the result with 10% of the effort

---

### Phase 5: Admin Dashboard — Sales View (Week 3-4)

*(Original tasks unchanged — see original plan)*

#### Phase 5 Research Insights

**Admin security:**
- [ ] Rate limit all admin endpoints (export: 10/hour, leads: 60/min, analytics: 60/min, token create: 20/hour)
- [ ] Implement admin audit log for all mutations (token creation, revocation, data exports)
- [ ] Use streaming CSV generation with `ReadableStream` for exports (avoids memory limits on Vercel)
- [ ] Log all admin API access with admin user ID, action, timestamp

**Engagement scoring (simplification option):**
For MVP with <50 leads, consider replacing the weighted algorithm with:
- Sort by `last_visit_at` DESC
- Show boolean flags: PDF Exported, Contact Sales Clicked
- Show visit count and last visit date
- This tells sales reps everything they need. Build scoring algorithm in v2 when data exists to calibrate weights.

---

### Phase 6: Contact Sales CTA (Week 4)

*(Original tasks unchanged — see original plan)*

#### Phase 6 Research Insights

- [ ] Rate limit contact form: max 2 submissions per token per day
- [ ] Enforce max message length: 2000 characters
- [ ] Strip HTML tags from message before storage
- [ ] Validate `preferred_contact` strictly: `"email"` or `"phone"` only
- [ ] Use Resend's structured templates for notification emails (prevents email header injection)

---

### Phase 7: Polish, GDPR, and Launch Prep (Week 4)

*(Original tasks unchanged — see original plan)*

#### Phase 7 Research Insights

**GDPR compliance gaps to address:**
- [ ] Build GDPR erasure function (`delete_lead_gdpr`) with audit logging
- [ ] Define data retention policy: auto-anonymize inactive leads after 24 months, delete events after 12 months
- [ ] Execute Data Processing Agreement with Supabase
- [ ] Confirm Supabase hosting region is EU (or implement Standard Contractual Clauses)
- [ ] Build "Request Data Deletion" link in privacy policy → DSAR ticket
- [ ] Parse user agent to extract only `device_type` (desktop/mobile/tablet) — discard raw string (GDPR data minimization)
- [ ] Cookie consent: store choice in localStorage (not cookie) since declined users can't have cookies set
- [ ] Add "Cookie Settings" link in footer to re-open consent banner

**Performance verification:**
- [ ] Benchmark `calculateRevenue()` — must complete in <16ms. Current HTML prototype runs in ~1ms (simple arithmetic loops), so this should be trivial.
- [ ] Monitor Vercel serverless function execution time for PDF generation
- [ ] Test with simulated 100+ leads in admin dashboard (ensure no N+1 queries)

**Email deliverability:**
- [ ] Progress DMARC from `p=none` to `p=quarantine` after 2 weeks of clean sending
- [ ] Set up Resend webhook for bounce events → suppress bounced addresses
- [ ] Test magic link emails with Gmail, Outlook, Yahoo, and Apple Mail

---

## Database Schema (ERD)

*(Original ERD unchanged — see original plan)*

### Research Enhancement: Additional Schema Objects

**Add to migration 002_rls_policies.sql:**
- RLS enabled on all 7 tables
- Restrictive policies blocking all anon access (API routes use service_role)

**Add to migration 003_indexes.sql:**
- 9 performance indexes (see Performance section above)

**Add to migration 004_gdpr_functions.sql:**
- `gdpr_deletion_log` table
- `delete_lead_gdpr()` function
- `admin_audit_log` table

**Additional columns to add:**
- `tokens.verification_code_expires_at` (TIMESTAMPTZ)
- `tokens.verification_attempts` (INT DEFAULT 0)
- `events.client_sequence` (INT)
- `events.client_timestamp` (TIMESTAMPTZ)
- `leads.email_domain` → consider making a GENERATED ALWAYS AS column

---

## Alternative Approaches Considered

*(Unchanged from original plan)*

---

## System-Wide Impact

*(Original content preserved — see original plan)*

### Research Enhancement: Additional State Lifecycle Risks

- **Multiple tabs:** User opens calculator in multiple tabs with same token. Event batching and state saves could conflict. Mitigation: version counter on saves ensures newest wins. Events from both tabs are fine (both have same token_id).
- **Token revocation mid-session:** Show non-dismissible banner instead of redirect. User may want to copy their numbers.
- **Browser back/forward:** Calculator is a single page. Consider `beforeunload` warning if unsaved changes exist.

### Research Enhancement: Additional Integration Test Scenarios

6. **Magic link double-click:** User clicks link twice quickly → second verification within 30s returns same session (idempotent window) → after window, reject.
7. **Verification code brute-force:** After 5 failed attempts → code invalidated → user must request new magic link.
8. **GDPR erasure:** Admin deletes lead → all tokens, sessions, events, snapshots, contact_requests cascade-deleted → audit log entry created.
9. **PDF export during save:** User changes inputs, immediately clicks Download → save flushes first → PDF generated with fresh data.
10. **Admin CSV export with 10,000 leads:** Streaming response completes within Vercel timeout → no memory issues.

---

## Acceptance Criteria

*(Original content preserved — see original plan)*

### Research Enhancement: Additional Non-Functional Requirements

- [ ] RLS enabled on all Supabase tables (security)
- [ ] Verification codes expire after 15 minutes (security)
- [ ] All JSONB payloads validated server-side with Zod (security)
- [ ] Security headers configured in next.config.ts (security)
- [ ] Admin audit log captures all mutations (security)
- [ ] GDPR erasure function works end-to-end (compliance)
- [ ] Cookie consent respects decline (no analytics events tracked) (compliance)
- [ ] Event ordering preserved via client_sequence even with batched delivery (data integrity)
- [ ] Foreign key cascades are tested: deleting a lead removes all child records (data integrity)

---

## Success Metrics

*(Unchanged from original plan)*

---

## Dependencies & Prerequisites

*(Original content preserved — see original plan)*

### Research Enhancement: Additional Dependencies

| Dependency | Status | Blocker? |
|-----------|--------|----------|
| Zod (runtime validation) | Add to package.json | Yes (Phase 1 — API validation) |
| @react-email/components (email templates) | Add to package.json | Yes (Phase 1 — magic links) |
| DMARC DNS record configuration | Not started | Soft blocker (email deliverability) |
| Supabase EU region confirmation | Not started | Soft blocker (GDPR) |
| Data Processing Agreement with Supabase | Not started | Soft blocker (GDPR) |

---

## Risk Analysis & Mitigation

*(Original content preserved — see original plan)*

### Research Enhancement: Additional Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Supabase anon key data exposure (no RLS) | HIGH if RLS not enabled | CRITICAL | Enable RLS on all tables before any production traffic |
| Verification code brute-force | Medium | High | 128-bit entropy codes + 15-min expiry + 5-attempt limit |
| JSONB payload injection/XSS | Medium | High | Server-side Zod validation + max payload size + HTML-escape in admin |
| PDF generation timeout on Vercel | Low | Medium | Monitor render times; fall back to browser print if needed |
| Event data loss on tab close | Medium | Low | sendBeacon + flush pending debounces on visibilitychange |
| Stale snapshot in PDF export | Medium | Medium | Force synchronous save before PDF generation |

---

## Future Considerations

*(Unchanged from original plan)*

---

## Documentation Plan

*(Unchanged from original plan)*

---

## Sources & References

### Origin

- **Brainstorm document:** [docs/brainstorms/2026-03-08-tether-revenue-simulator-product-brainstorm.md](docs/brainstorms/2026-03-08-tether-revenue-simulator-product-brainstorm.md)

### Internal References

*(Unchanged from original plan)*

### External References

- Supabase Auth docs: https://supabase.com/docs/guides/auth
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Next.js App Router: https://nextjs.org/docs/app
- @react-pdf/renderer: https://react-pdf.org/
- Recharts: https://recharts.org/
- recharts-to-png: https://github.com/brammitch/recharts-to-png
- iron-session: https://github.com/vvo/iron-session
- Resend: https://resend.com/docs
- @react-email/components: https://react.email/docs
- Zod: https://zod.dev/

### Decisions Made During Planning (Not in Brainstorm)

*(Unchanged from original plan)*

### Research Agents Used for Deepening

| Agent | Focus Area | Key Finding |
|-------|-----------|-------------|
| security-sentinel | OWASP, auth, GDPR | RLS must be enabled; verification codes need high entropy |
| performance-oracle | DB queries, scalability | 9 indexes needed; engagement scoring is premature optimization |
| architecture-strategist | Design patterns, boundaries | Custom CPO auth is correct; separate Supabase client factories |
| kieran-typescript-reviewer | Type safety, patterns | Discriminated unions for events; Zod at API boundaries |
| julik-frontend-races-reviewer | Race conditions, timing | 4 high-severity races in save/load/export flows |
| code-simplicity-reviewer | YAGNI, scope | 40-50% LOC reduction possible; sessions table duplicates events |
| data-integrity-guardian | Constraints, cascades, GDPR | Missing NOT NULL/CHECK constraints; CASCADE rules for erasure |
| pattern-recognition-specialist | Naming, consistency | Event type naming inconsistency; module verb/noun mix |
| best-practices-researcher | Framework patterns | iron-session async in Next.js 15+; Resend DMARC progression |
| spec-flow-analyzer | User flow gaps | 10 additional edge cases (magic link expiry, multi-device, etc.) |
