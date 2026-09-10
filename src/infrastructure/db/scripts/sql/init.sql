CREATE SCHEMA IF NOT EXISTS markbot;

CREATE TABLE IF NOT EXISTS markbot.user (
    id VARCHAR(40) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    creation_date TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP(6),
    password_hash VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(512),
    failed_login_count INT DEFAULT 0,
    locked_until TIMESTAMP(6),
    verified_at TIMESTAMP(6),
    two_factor_enrolled_at TIMESTAMP(6)
);

-- Los documentos y su índice viven en Pergamo.
DROP TABLE IF EXISTS markbot.documentchunkasset, markbot.documentchunk, markbot.document;

CREATE TABLE IF NOT EXISTS markbot.userasset (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(40) NOT NULL,
    asset_type VARCHAR(20) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    content TEXT NOT NULL,
    metadata JSONB,
    creation_date TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_userasset_user FOREIGN KEY (user_id) REFERENCES markbot.user(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_userasset_user ON markbot.userasset(user_id);

CREATE TABLE IF NOT EXISTS markbot.api_key (
    id VARCHAR(40) PRIMARY KEY,
    user_id VARCHAR(40) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    prefix VARCHAR(10) NOT NULL,
    expiration_date TIMESTAMP(6),
    domain VARCHAR(255),
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES markbot.user(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_api_key_user ON markbot.api_key(user_id);

CREATE TABLE IF NOT EXISTS markbot.user_2fa_totp (
    user_id VARCHAR(40) PRIMARY KEY REFERENCES markbot.user(id) ON DELETE CASCADE,
    secret_encrypted VARCHAR(512) NOT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP(6),
    last_used_at TIMESTAMP(6)
);

CREATE TABLE IF NOT EXISTS markbot.user_2fa_recovery_code (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(40) REFERENCES markbot.user(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP(6)
);

CREATE INDEX IF NOT EXISTS idx_recovery_user ON markbot.user_2fa_recovery_code(user_id);
