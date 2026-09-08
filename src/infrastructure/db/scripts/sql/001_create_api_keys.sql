
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
