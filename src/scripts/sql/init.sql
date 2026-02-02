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
