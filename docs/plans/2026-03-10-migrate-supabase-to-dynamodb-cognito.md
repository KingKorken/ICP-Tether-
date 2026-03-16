# Plan: Migrate from Supabase to DynamoDB

## Summary

Replace the Supabase/Postgres backend with AWS DynamoDB and add AWS Cognito for admin authentication. This touches the database layer (client, queries, schema), 3 API routes that use Supabase directly, and the admin auth layer. iron-session (CPO auth), middleware, all UI components, the calculation engine, and event tracking client remain unchanged.

**Note:** The customer needs to create a new AWS account. The table creation script and launch guide will cover initial AWS setup.

## Architecture Decision: 2-Table Design

**Table 1: `TetherMain`** — All core entities (leads, tokens, sessions, snapshots, contact_requests, admin_users, audit_log, stats counters). Uses composite primary key (PK + SK) with entity-prefixed keys.

**Table 2: `TetherEvents`** — High-volume tracking events only. Separated because events have fundamentally different write volume, are append-only, and benefit from TTL auto-expiry.

### Key Design for TetherMain

| Entity | PK | SK |
|---|---|---|
| Lead | `LEAD#<email>` | `LEAD#<email>` |
| Token | `LEAD#<email>` | `TOKEN#<token_uuid>` |
| Session | `TOKEN#<token_uuid>` | `SESSION#<session_id>` |
| Snapshot | `TOKEN#<token_uuid>` | `SNAPSHOT#<timestamp>#<id>` |
| ContactRequest | `LEAD#<email>` | `CONTACT#<timestamp>#<id>` |
| AdminUser | `ADMIN#<id>` | `ADMIN#<id>` |
| AuditLog | `AUDIT#<admin_id>` | `AUDIT#<timestamp>#<id>` |
| GDPRLog | `GDPR#<id>` | `GDPR#<id>` |
| Stats | `STATS` | `STATS` |

### GSIs

1. **GSI1 (Token Lookup)** — PK: `GSI1PK` (token UUID), SK: `GSI1SK`. Critical hot path.
2. **GSI2 (Admin Lead List)** — PK: `entityType` = "LEAD", SK: `lastVisitAt`. Sorted lead listing.
3. **GSI3 (Verification Code)** — PK: `verificationCode`, SK: `SK`. Sparse index for magic links.

### TetherEvents Table

PK: `tokenId`, SK: `<sessionId>#<createdAt>#<eventId>`. TTL on `ttl` attribute (90-day auto-expire).

## Dependency Changes

**Remove:**
- `@supabase/supabase-js`
- `@supabase/ssr`

**Add:**
- `@aws-sdk/client-dynamodb`
- `@aws-sdk/lib-dynamodb`
- `@aws-sdk/client-cognito-identity-provider`
- `amazon-cognito-identity-js`

## Environment Variable Changes

**Remove:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Add:**
- `AWS_REGION` (e.g., `eu-west-1`)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DYNAMODB_TABLE_MAIN` (default: `TetherMain`)
- `DYNAMODB_TABLE_EVENTS` (default: `TetherEvents`)
- `COGNITO_USER_POOL_ID` — Cognito User Pool ID
- `COGNITO_CLIENT_ID` — Cognito App Client ID
- `COGNITO_CLIENT_SECRET` — Cognito App Client Secret (if confidential client)

## Files to Modify/Replace

### New files to create:
1. `src/lib/db/dynamodb.ts` — DynamoDB DocumentClient singleton + table constants
2. `scripts/create-tables.ts` — Table creation script (replaces SQL migrations)
3. `src/lib/auth/cognito.ts` — Cognito client singleton + helper functions (signIn, signOut, verifySession)
4. `src/app/(admin)/login/page.tsx` — Admin login page (email + password form)
5. `src/app/api/admin/auth/login/route.ts` — Admin login API route (Cognito InitiateAuth)
6. `src/app/api/admin/auth/logout/route.ts` — Admin logout API route (clear session)
7. `scripts/create-cognito-admin.ts` — Script to create Cognito User Pool + first admin user

### Files to rewrite:
8. `src/lib/db/queries.ts` — All 14 query functions rewritten for DynamoDB API
9. `src/app/api/auth/request-link/route.ts` — Remove direct `createServerClient()` import
10. `src/app/api/admin/analytics/route.ts` — Replace direct Supabase queries with DynamoDB queries
11. `src/app/api/admin/export/route.ts` — Replace direct Supabase queries with DynamoDB queries
12. `src/app/(simulator)/sim/t/[token]/page.tsx` — Minor: `token.leads` denormalized access pattern changes
13. `src/app/(admin)/layout.tsx` — Add Cognito session check, redirect to login if unauthenticated
14. `src/app/api/admin/leads/route.ts` — Add Cognito auth guard + cursor-based pagination

### Files to delete:
15. `src/lib/db/server.ts` — Replaced by dynamodb.ts
16. `src/lib/db/browser.ts` — No longer needed (DynamoDB has no browser client)
17. `supabase/migrations/*.sql` — All 4 migration files replaced by create-tables script

### Files unchanged:
- `src/lib/session.ts` — iron-session works independently
- `src/middleware.ts` — Format validation only, no DB calls
- `src/lib/calculator/*` — No DB dependency
- `src/lib/tracking/tracker.ts` — Client-side, calls API routes
- `src/lib/tracking/events.ts` — Type definitions only
- `src/lib/tokens/generator.ts` — Crypto operations only
- `src/lib/tokens/validation.ts` — Zod validation only
- `src/lib/utils/*` — Pure utility functions
- `src/lib/rate-limit.ts` — In-memory, no DB
- `src/lib/api-utils.ts` — Request utilities
- `src/lib/scoring/engagement.ts` — Pure calculation
- All component files — UI layer unchanged
- `src/emails/magic-link.tsx` — Email template unchanged

## Implementation Steps

### Step 1: Update dependencies
- Remove `@supabase/supabase-js`, `@supabase/ssr` from package.json
- Add `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-cognito-identity-provider`, `amazon-cognito-identity-js`
- npm install

### Step 2: Create DynamoDB client (`src/lib/db/dynamodb.ts`)
- DynamoDBClient + DynamoDBDocumentClient singleton
- Export table name constants
- Configure marshalling options (removeUndefinedValues, wrapNumbers: false)

### Step 3: Create table setup script (`scripts/create-tables.ts`)
- CreateTable for TetherMain with 3 GSIs
- CreateTable for TetherEvents with 1 GSI + TTL
- On-demand billing mode (PAY_PER_REQUEST)
- Runnable via `npx tsx scripts/create-tables.ts`

### Step 4: Create Cognito auth layer

**`src/lib/auth/cognito.ts`** — Cognito client + helpers:
- `CognitoIdentityProviderClient` singleton
- `adminLogin(email, password)` — Calls `InitiateAuthCommand` with `USER_PASSWORD_AUTH` flow, returns access + refresh tokens
- `verifyAdminSession(accessToken)` — Calls `GetUserCommand` to validate the token
- `adminLogout(accessToken)` — Calls `GlobalSignOutCommand`
- Store Cognito access token in an iron-session cookie (separate from the CPO session cookie, named `tether_admin_session`)

**`src/app/(admin)/login/page.tsx`** — Admin login form:
- Email + password form, submits to `/api/admin/auth/login`
- On success, redirects to `/dashboard`
- Shows error messages on failure

**`src/app/api/admin/auth/login/route.ts`** — Login API:
- Accepts `{ email, password }`, calls `adminLogin()`
- Stores Cognito access token in iron-session
- Returns success/failure

**`src/app/api/admin/auth/logout/route.ts`** — Logout API:
- Clears admin session cookie
- Calls `adminLogout()` to invalidate Cognito tokens

**`src/app/(admin)/layout.tsx`** — Auth guard:
- Server component reads admin session cookie
- If no valid session, redirect to `/login`
- Pass admin email to child components via context or props

**`scripts/create-cognito-admin.ts`** — Setup script:
- Creates Cognito User Pool with email sign-in
- Creates App Client (with secret)
- Creates first admin user with temporary password
- Outputs User Pool ID and Client ID for `.env.local`
- Runnable via `npx tsx scripts/create-cognito-admin.ts --email admin@example.com`

**All admin API routes** get an auth guard helper:
- `requireAdmin(request)` — reads admin session cookie, verifies with Cognito, returns admin email or throws 401

### Step 5: Rewrite `src/lib/db/queries.ts` — All 14 functions
Each function maps to DynamoDB operations:

| Function | DynamoDB Operation | Key Changes |
|---|---|---|
| `upsertLead` | UpdateCommand with `if_not_exists` | Atomic upsert, compute email_domain in app |
| `verifyLead` | UpdateCommand | Simple attribute update |
| `getLeadByEmail` | GetCommand | Direct by PK/SK |
| `createToken` | PutCommand | Denormalize lead email onto token item |
| `getActiveToken` | QueryCommand on GSI1 | Returns token + denormalized lead data |
| `verifyMagicLinkCode` | QueryCommand on GSI3 + UpdateCommand | Two-step: find + update |
| `touchToken` | UpdateCommand on GSI1PK | Update last_used_at |
| `getTokensForLead` | QueryCommand | PK = LEAD#email, SK begins_with TOKEN# |
| `createSession` | PutCommand | Under TOKEN# partition |
| `insertEvents` | BatchWriteCommand (chunked to 25) | To TetherEvents table, with TTL |
| `saveSnapshot` | PutCommand with ConditionExpression | Version guard via condition |
| `getLatestSnapshot` | QueryCommand | PK = TOKEN#, SK begins_with SNAPSHOT#, ScanIndexForward=false, Limit=1 |
| `createContactRequest` | QueryCommand (rate check) + PutCommand | Count recent contacts first |
| `getLeadsForAdmin` | QueryCommand on GSI2 | Cursor-based pagination instead of offset |
| `logAdminAction` | PutCommand | Under AUDIT# partition |

**New function:** `getStats()` — Single GetItem on STATS item for analytics counters
**New function:** `deleteLeadGdpr()` — Multi-step cascade delete in application code

### Step 6: Update API routes with direct Supabase calls
- `request-link/route.ts` — Remove `createServerClient` import, use queries.ts functions only
- `admin/analytics/route.ts` — Replace 5 count queries with single `getStats()` call + add `requireAdmin()` guard
- `admin/export/route.ts` — Replace Supabase query with DynamoDB scan + add `requireAdmin()` guard
- `admin/leads/route.ts` — Add `requireAdmin()` guard + switch to cursor-based pagination

### Step 7: Update simulator page
- `sim/t/[token]/page.tsx` — Access lead data from denormalized token item instead of `token.leads`

### Step 8: Delete Supabase files
- Delete `src/lib/db/server.ts`, `src/lib/db/browser.ts`
- Delete `supabase/migrations/` directory
- Delete `src/lib/db/schema.sql`

### Step 9: Update env template and documentation
- Update `.env.local` with AWS variables (DynamoDB + Cognito)
- Remove Supabase variables

### Step 10: Build verification
- `npx tsc --noEmit` — zero errors
- `npm run build` — clean build

## Key Behavioral Changes

1. **Pagination becomes cursor-based.** The admin leads endpoint changes from `?offset=50` to `?cursor=<encoded_key>`. The admin dashboard component needs a minor update to handle this.
2. **Lead data is denormalized onto token items.** When a lead's company name changes, token items need updating too (write amplification, but reads are much faster).
3. **Analytics use pre-computed counters.** The `upsertLead`, `verifyLead`, and `createContactRequest` functions increment/decrement a STATS item. The analytics endpoint reads one item instead of 5 count queries.
4. **No RLS.** All access control is in API route handlers (already the case — Supabase RLS was blocking anon access, and all queries used service_role to bypass it).
5. **Events auto-expire after 90 days** via DynamoDB TTL (free).
6. **Admin auth via Cognito.** Admin users log in with email + password through a dedicated `/login` page. Cognito access tokens are stored in a separate iron-session cookie (`tether_admin_session`). All admin API routes verify the token with Cognito before processing. The `AdminUser` DynamoDB entity is no longer needed for auth (Cognito handles it), but kept for audit log attribution.
7. **Two separate iron-session cookies.** CPO prospects use `tether_sim_session` (magic-link auth). Admins use `tether_admin_session` (Cognito auth). They don't interfere with each other.

## Verification

1. `npx tsc --noEmit` — zero TypeScript errors
2. `npm run build` — clean Next.js build
3. Manual testing: Run `npx tsx scripts/create-tables.ts` against DynamoDB Local or real AWS
4. Manual testing: Run `npx tsx scripts/create-cognito-admin.ts --email admin@tether.com` to create User Pool + admin
5. Verify each API route works with DynamoDB (landing page → token creation → calculator load → event tracking → admin dashboard)
6. Verify admin login flow: `/login` → enter credentials → redirected to `/dashboard` → all admin pages accessible
7. Verify admin auth guard: accessing `/dashboard` without login redirects to `/login`
