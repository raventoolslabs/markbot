-- 1. Modify existsing user table
ALTER TABLE markbot.user 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(512), -- Encrypted
ADD COLUMN IF NOT EXISTS failed_login_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP(6); -- For 2FA/Email verification

-- 2. Create TOTP table
CREATE TABLE IF NOT EXISTS markbot.user_2fa_totp (
    user_id VARCHAR(40) PRIMARY KEY REFERENCES markbot.user(id) ON DELETE CASCADE,
    secret_encrypted VARCHAR(512) NOT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP(6),
    last_used_at TIMESTAMP(6)
);

-- 3. Create Recovery Codes table
CREATE TABLE IF NOT EXISTS markbot.user_2fa_recovery_code (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(40) REFERENCES markbot.user(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP(6)
);

CREATE INDEX IF NOT EXISTS idx_recovery_user ON markbot.user_2fa_recovery_code(user_id);
