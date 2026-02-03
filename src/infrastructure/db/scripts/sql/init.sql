CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS markbot;

CREATE TABLE IF NOT EXISTS markbot.document (
    id VARCHAR(40) PRIMARY KEY,
    creation_date TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    modification_date TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    organization VARCHAR(64) NOT NULL,
    path VARCHAR(250) NOT NULL,
    metadata JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS markbot.documentchunk (
    id BIGSERIAL PRIMARY KEY,
    document_id VARCHAR(40) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    embedding vector,
    CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES markbot.document(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS markbot.documentchunkasset (
    id BIGSERIAL PRIMARY KEY,
    document_id VARCHAR(40) NOT NULL,
    chunk_id BIGINT,
    asset_type VARCHAR(20) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    content TEXT NOT NULL,
    metadata JSONB,
    creation_date TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documentchunkasset_doc FOREIGN KEY (document_id) REFERENCES markbot.document(id) ON DELETE CASCADE,
    CONSTRAINT fk_documentchunkasset_chunk FOREIGN KEY (chunk_id) REFERENCES markbot.documentchunk(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_documentchunkasset_document ON markbot.documentchunkasset(document_id);
CREATE INDEX IF NOT EXISTS idx_documentchunkasset_chunk ON markbot.documentchunkasset(chunk_id);
