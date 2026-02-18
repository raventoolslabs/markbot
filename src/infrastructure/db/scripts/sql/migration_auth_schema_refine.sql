-- Refine user table to match specific requirements
ALTER TABLE markbot.user 
-- Rename is_two_factor_enabled to two_factor_enabled
RENAME COLUMN is_two_factor_enabled TO two_factor_enabled;

ALTER TABLE markbot.user
-- Remove redundant secret (stored in auxiliary table)
DROP COLUMN IF EXISTS two_factor_secret,
-- Add new timestamps
ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS two_factor_enrolled_at TIMESTAMP(6),
-- Add email verified
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Update constraints
ALTER TABLE markbot.user
ALTER COLUMN failed_login_count SET NOT NULL;

-- Add check constraint
ALTER TABLE markbot.user
ADD CONSTRAINT chk_failed_login_nonneg CHECK (failed_login_count >= 0);
