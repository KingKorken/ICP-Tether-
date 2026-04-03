-- =============================================
-- Seed: Test prospect user + Admin user setup
-- =============================================
--
-- This migration seeds:
-- 1. A test prospect lead + token for testing the calculator flow
-- 2. Admin user record (requires Supabase Auth user to be created separately)
--
-- IMPORTANT: The admin Supabase Auth user must be created via the
-- Supabase Dashboard (Authentication > Users > Add User) with:
--   Email: tim.buhrow@alumni.esade.edu
--   Password: (set your own)
-- Then copy the user's UUID and update the admin_users INSERT below.

-- =============================================
-- 1. Test Prospect Lead + Token
-- =============================================

-- Use a deterministic UUID for the test token so the URL is predictable
-- Token: 00000000-test-0000-0000-000000000001
-- URL: /sim/t/00000000-test-0000-0000-000000000001

INSERT INTO leads (id, email, company_name, is_free_email, is_verified, country, total_visits)
VALUES (
  gen_random_uuid(),
  'test@tether.dev',
  'Tether Test Account',
  false,
  true,
  'sweden',
  1
)
ON CONFLICT (email) DO NOTHING;

-- Create a sales-generated token for the test lead
-- We need the lead ID, so use a subquery
INSERT INTO tokens (lead_id, token, origin, is_active, prefilled_data)
SELECT
  l.id,
  '00000000-test-0000-0000-000000000001',
  'sales_generated',
  true,
  '{"country": "sweden", "type": "public", "chargers": 500, "powerMW": 0.011, "utilization": 0.15, "flexPotential": 0.50, "horizonMonths": 12, "company": "Tether Test Account"}'::jsonb
FROM leads l
WHERE l.email = 'test@tether.dev'
ON CONFLICT (token) DO NOTHING;

-- Create a sample snapshot so the admin detail page has data to show
INSERT INTO snapshots (token_id, input_state, output_results, client_version)
SELECT
  t.id,
  '{"country": "sweden", "type": "public", "chargers": 500, "powerMW": 0.011, "utilization": 0.15, "flexPotential": 0.50, "horizonMonths": 12, "company": "Tether Test Account"}'::jsonb,
  '{"totalCPO": 42850, "ecreditCPO": 18200, "flexCPO": 24650, "perCharger": 85.7, "totalMonths": 12}'::jsonb,
  1
FROM tokens t
WHERE t.token = '00000000-test-0000-0000-000000000001';

-- =============================================
-- 2. Admin User Record
-- =============================================
--
-- NOTE: You MUST first create a Supabase Auth user via the Dashboard:
--   1. Go to Supabase Dashboard > Authentication > Users
--   2. Click "Add User" > "Create new user"
--   3. Email: tim.buhrow@alumni.esade.edu
--   4. Set a password
--   5. Copy the generated User UID
--   6. Run this SQL manually with the correct UUID:
--
--   INSERT INTO admin_users (id, email, role)
--   VALUES ('<paste-uid-here>', 'tim.buhrow@alumni.esade.edu', 'admin')
--   ON CONFLICT (email) DO NOTHING;
--
-- For now, we insert a placeholder that will match once the Auth user is created.
-- The admin layout checks both Auth + admin_users, so both must exist.

-- This will be a no-op until the Auth user is created and this is updated
-- with the correct UUID. Uncomment and run manually after creating the Auth user.

-- INSERT INTO admin_users (id, email, role)
-- VALUES ('<supabase-auth-user-uuid>', 'tim.buhrow@alumni.esade.edu', 'admin')
-- ON CONFLICT (email) DO NOTHING;
