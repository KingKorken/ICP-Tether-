-- =============================================
-- GDPR Right to Erasure — Deletion log + function
-- =============================================

CREATE TABLE gdpr_deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  lead_email TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  requested_by UUID REFERENCES admin_users(id),
  tables_affected TEXT[]
);

ALTER TABLE gdpr_deletion_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only" ON gdpr_deletion_log
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- GDPR erasure function: deletes lead and all cascaded data, logs the action
CREATE OR REPLACE FUNCTION delete_lead_gdpr(target_lead_id UUID, admin_id UUID)
RETURNS void AS $$
DECLARE
  lead_email TEXT;
BEGIN
  SELECT email INTO lead_email FROM leads WHERE id = target_lead_id;

  IF lead_email IS NULL THEN
    RAISE EXCEPTION 'Lead not found: %', target_lead_id;
  END IF;

  -- Log the deletion BEFORE deleting (captures the email)
  INSERT INTO gdpr_deletion_log (
    lead_id, lead_email, requested_by, completed_at, tables_affected
  )
  VALUES (
    target_lead_id,
    lead_email,
    admin_id,
    now(),
    ARRAY['leads', 'tokens', 'sessions', 'events', 'snapshots', 'contact_requests']
  );

  -- CASCADE handles all child records
  DELETE FROM leads WHERE id = target_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
