-- =============================================
-- Tether Revenue Simulator — Initial Schema
-- =============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- LEADS — CPO prospects who entered their email
-- =============================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL DEFAULT '',
  email_domain TEXT NOT NULL GENERATED ALWAYS AS (split_part(email, '@', 2)) STORED,
  is_free_email BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  last_visit_at TIMESTAMPTZ,
  total_visits INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT leads_total_visits_non_negative CHECK (total_visits >= 0),
  CONSTRAINT leads_verified_after_created CHECK (verified_at IS NULL OR verified_at >= created_at)
);

-- =============================================
-- TOKENS — Access tokens for calculator URLs
-- =============================================
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  origin TEXT NOT NULL DEFAULT 'organic',
  verification_code TEXT,
  verification_code_expires_at TIMESTAMPTZ,
  verification_attempts INTEGER NOT NULL DEFAULT 0,
  prefilled_data JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,

  CONSTRAINT tokens_origin_valid CHECK (origin IN ('organic', 'sales_generated'))
);

-- =============================================
-- SESSIONS — Individual visits to the calculator
-- =============================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  user_agent TEXT,
  referrer TEXT,
  device_type TEXT,
  events_count INTEGER NOT NULL DEFAULT 0
);

-- =============================================
-- EVENTS — Every interaction tracked
-- =============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  client_sequence INTEGER,
  client_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- SNAPSHOTS — Calculator state captures
-- =============================================
CREATE TABLE snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  input_state JSONB NOT NULL,
  output_results JSONB NOT NULL,
  client_version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- CONTACT_REQUESTS — Sales CTA form submissions
-- =============================================
CREATE TABLE contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '',
  preferred_contact TEXT NOT NULL DEFAULT 'email',
  is_handled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT contact_requests_preferred_contact_valid CHECK (preferred_contact IN ('email', 'phone'))
);

-- =============================================
-- ADMIN_USERS — Tether team members
-- =============================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY, -- matches Supabase Auth uid
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'sales',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT admin_users_role_valid CHECK (role IN ('sales', 'leadership', 'admin'))
);

-- =============================================
-- ADMIN_AUDIT_LOG — Tracks admin actions
-- =============================================
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
