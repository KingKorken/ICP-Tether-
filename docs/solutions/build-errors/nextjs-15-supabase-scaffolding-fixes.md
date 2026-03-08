---
title: "Next.js 15 + Supabase Scaffolding: npm Cache, Manual Setup, React 19 Types, Edge Runtime"
date: "2026-03-08"
category: "build-errors"
tags: ["next.js-15", "npm", "typescript", "react-19", "iron-session", "supabase", "edge-runtime", "eacces", "scaffolding"]
severity: "high"
components: ["npm-cache", "create-next-app", "typescript-strict-mode", "iron-session", "next-middleware", "edge-runtime"]
symptoms:
  - "npm install EACCES permission denied on ~/.npm/_cacache"
  - "npx create-next-app hangs on React Compiler interactive prompt"
  - "useRef Expected 1 arguments but got 0 in React 19"
  - "iron-session cookie type mismatch in Next.js middleware Edge Runtime"
root_cause: "Multiple independent build-time issues: root-owned npm cache, non-TTY interactive prompts, React 19 stricter generics, Edge Runtime API surface mismatch"
resolution_time: "~30 minutes across multiple iterations"
---

# Next.js 15 + Supabase Scaffolding Fixes

Four independent build-time issues encountered while scaffolding a production Next.js 15 application with Supabase, iron-session, and React 19.

## Problem 1: npm Cache EACCES Permission Error

### Symptom

```
npm error code EEXIST
npm error syscall mkdir
npm error path /Users/timbuhrow/.npm/_cacache/content-v2/sha512/ce/17
npm error EACCES: permission denied, mkdir '...'
```

### Root Cause

A previous npm version (or a `sudo npm install`) created root-owned files in the user's `~/.npm/_cacache` directory. Subsequent npm runs as the regular user can't write to these directories.

### What Didn't Work

- `npm cache clean --force` — also fails with EACCES on the same directories
- `sudo chown -R $(whoami) ~/.npm` — requires password input (unavailable in non-interactive context)

### Working Solution

Use an alternate cache directory:

```bash
npm install --cache /tmp/npm-cache-tether
```

This bypasses the corrupted cache entirely. The `--cache` flag tells npm to use a temporary writable directory instead of `~/.npm`.

### Permanent Fix

When you have terminal access with sudo:

```bash
sudo chown -R $(whoami) ~/.npm
```

---

## Problem 2: create-next-app Hanging on Interactive Prompt

### Symptom

```
? Would you like to use React Compiler? › No / Yes
[hangs indefinitely]
```

`npx create-next-app` blocks on the React Compiler prompt in non-TTY environments (IDE terminals, piped scripts, CI).

### Root Cause

The `create-next-app` CLI added a new interactive prompt for React Compiler that isn't covered by existing `--no-*` flags. In non-TTY environments, stdin blocks forever waiting for input.

### What Didn't Work

- Piping `echo "No" | npx create-next-app ...` — works for the prompt but npm install still fails if cache is corrupted
- No `--no-react-compiler` flag exists

### Working Solution

Skip `create-next-app` entirely. Manually create all config files:

1. `package.json` — with all dependencies listed explicitly
2. `tsconfig.json` — standard Next.js TypeScript config
3. `next.config.ts` — with security headers
4. `postcss.config.mjs` — Tailwind v4 PostCSS plugin
5. `eslint.config.mjs` — flat config extending next/core-web-vitals
6. `.gitignore` — standard Next.js ignores

Then run `npm install --cache /tmp/npm-cache` to install everything cleanly.

**Key advantage:** Full control over every config file. No surprises from scaffold defaults.

---

## Problem 3: React 19 useRef Strict Types

### Symptom

```
error TS2554: Expected 1 arguments, but got 0.
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
```

### Root Cause

React 19's TypeScript types are stricter than React 18. `useRef<T>()` without an initial value is no longer allowed — you must provide an initial value.

### Working Solution

Add `| null` to the type and provide `null` as the initial value:

```typescript
// Before (React 18 — worked, React 19 — fails)
const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

// After (React 19 — works)
const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

When using the ref:

```typescript
// Clear with null check
if (saveTimeoutRef.current) {
  clearTimeout(saveTimeoutRef.current);
}
```

---

## Problem 4: iron-session + Next.js Middleware Edge Runtime

### Symptom

```
error TS2345: Argument of type 'Request | IncomingMessage' is not assignable
to parameter of type 'CookieStore'.
```

Calling `getIronSession(request.cookies, ...)` in Next.js middleware fails because the Edge Runtime's `RequestCookies` type doesn't match iron-session's expected `CookieStore`.

### Root Cause

Next.js middleware runs in the Edge Runtime, which has a different cookie API than the Node.js runtime. iron-session expects the `cookies()` function from `next/headers` (Node.js runtime only), not `request.cookies` from the Edge Runtime.

### Working Solution

Remove iron-session from middleware entirely. Keep middleware lightweight (format validation only) and do full auth in Server Components:

**Middleware (format check only):**

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/sim/t/")) {
    return NextResponse.next();
  }

  // Extract and validate token format (UUID check)
  const segments = pathname.split("/");
  const urlToken = segments[3];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!urlToken || !uuidRegex.test(urlToken)) {
    return NextResponse.redirect(new URL("/?error=invalid-token", request.url));
  }

  return NextResponse.next();
}
```

**Server Component (full validation with iron-session):**

```typescript
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export default async function SimulatorPage({ params }) {
  const cookieStore = await cookies(); // async in Next.js 15+
  const session = await getIronSession(cookieStore, sessionOptions);
  // Full DB validation here...
}
```

**Key insight:** `cookies()` is async in Next.js 15+ and only works in the Node.js runtime (Server Components, Route Handlers), not in Edge middleware.

---

## Prevention Strategies

| Issue | Prevention | Detection |
|-------|-----------|-----------|
| npm cache perms | Use `npm ci` in CI; set `--cache` flag | `npm cache verify` pre-build |
| Interactive prompts | Set `CI=true`; maintain template repos | Set strict CI timeouts |
| useRef strict types | Always provide initial value; `strict: true` in tsconfig | `tsc --noEmit` in pre-commit hook |
| iron-session + Edge | Keep middleware lightweight; auth in Server Components | Test middleware locally; check Edge Runtime docs |

## Best Practices

1. **npm in CI:** Always use `npm ci` (not `npm install`) and configure an explicit cache directory
2. **Project scaffolding:** Maintain a team template repo instead of relying on `create-next-app` in automation
3. **React 19 refs:** Standard pattern is `useRef<T | null>(null)` — always include the initial value
4. **Next.js middleware:** Keep it thin — format validation, redirects, headers only. No heavy libraries or DB calls
5. **iron-session + Next.js 15:** Use in Route Handlers and Server Components only (Node.js runtime). `cookies()` is async.

## Related

- No existing solutions documented yet (first entry in docs/solutions/)
- iron-session docs: https://github.com/vvo/iron-session
- Next.js Edge Runtime limitations: https://nextjs.org/docs/app/api-reference/edge
