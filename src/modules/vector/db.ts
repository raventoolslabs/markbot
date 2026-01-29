import { Pool } from 'pg';
import { config } from '../../config';
import { logger } from '../../util/logger';

class VectorDB {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            host: config.dbHost,
            port: config.dbPort,
            user: config.dbUser,
            password: config.dbPassword,
            database: config.dbName,
        });

        this.pool.on('error', (err) => {
            logger.error('Unexpected error on idle client', 'VectorDB', err);
        });
    }

    async initialize() {
        try {

            logger.info('Initializing Vector Database...', 'VectorDB');

            // Ensure pgvector extension exists
            await this.pool.query('CREATE EXTENSION IF NOT EXISTS vector;');

            // Create documents table (384 for all-MiniLM-L6-v2)
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY, 
                content TEXT NOT NULL,
                metadata JSONB,
                embedding vector(384)
                );
            `);

            logger.info('Vector Database initialized successfully.', 'VectorDB');

        } catch (error) {
            logger.error('Failed to initialize Vector Database', 'VectorDB', error);
            // Don't throw here, let the application continue if the user hasn't started Docker yet
        }
    }

    async query(text: string, params?: any[]) {
        return this.pool.query(text, params);
    }

    async close() {
        await this.pool.end();
    }
}

export const vectorDb = new VectorDB();
