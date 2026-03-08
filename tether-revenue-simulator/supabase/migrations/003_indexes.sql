-- =============================================
-- Performance Indexes
-- =============================================

-- Token lookups (most critical — happens on every page load via middleware)
CREATE INDEX idx_tokens_active_lookup ON tokens (token) WHERE is_active = true;
CREATE INDEX idx_tokens_lead_active ON tokens (lead_id) WHERE is_active = true;

-- Session queries
CREATE INDEX idx_sessions_token_started ON sessions (token_id, started_at DESC);
CREATE INDEX idx_sessions_orphaned ON sessions (started_at) WHERE ended_at IS NULL;

-- Event queries
CREATE INDEX idx_events_session_created ON events (session_id, created_at);
CREATE INDEX idx_events_token_type ON events (token_id, event_type);

-- Snapshot queries
CREATE INDEX idx_snapshots_session ON snapshots (session_id, created_at DESC);
CREATE INDEX idx_snapshots_token_latest ON snapshots (token_id, created_at DESC);

-- Admin queries
CREATE INDEX idx_contact_requests_unhandled ON contact_requests (created_at DESC) WHERE is_handled = false;
CREATE INDEX idx_leads_email_domain ON leads (email_domain);
CREATE INDEX idx_leads_last_visit ON leads (last_visit_at DESC NULLS LAST);
