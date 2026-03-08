-- =============================================
-- Row Level Security — CRITICAL
-- All anon access blocked. API routes use service_role.
-- =============================================

-- Enable RLS on ALL tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Block all direct anon access (everything goes through API routes with service_role)
CREATE POLICY "No anon access" ON leads FOR ALL USING (false);
CREATE POLICY "No anon access" ON tokens FOR ALL USING (false);
CREATE POLICY "No anon access" ON sessions FOR ALL USING (false);
CREATE POLICY "No anon access" ON events FOR ALL USING (false);
CREATE POLICY "No anon access" ON snapshots FOR ALL USING (false);
CREATE POLICY "No anon access" ON contact_requests FOR ALL USING (false);

-- Admin users can read their own record
CREATE POLICY "Admin self-read" ON admin_users
  FOR SELECT
  USING (auth.uid() = id);

-- Admin audit log: admins can read all entries
CREATE POLICY "Admin audit read" ON admin_audit_log
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));
