-- ════════════════════════════════════════════════════════════════════════════
-- STAGING / QA ONLY. Creates a test candidate and a single-use access code valid for 24 hours.
-- Run in Dashboard → SQL Editor. The result grid shows the access code ONCE (only its hash is
-- stored), so copy it immediately. Change the name/email to create more test candidates.
-- ════════════════════════════════════════════════════════════════════════════
select access_code, valid_until, candidate_id
from private.create_test_invitation('Staging Test Candidate', 'staging.test@example.com');
