import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { logger } from '@/infrastructure/logging/logger';
import { Database } from './schema/Database';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '@/app/config';

class ManagerDb {
    public db: Kysely<Database>;

    constructor() {
        const dialect = new PostgresDialect({
            pool: new Pool({
                connectionString: config.databaseUrl,
            })
        });

        this.db = new Kysely<Database>({
            dialect,
        });
    }

    async initialize() {
        try {
            logger.info('Connecting to Database via Kysely...', 'ManagerDB');

            logger.info('Initializing Database Schema...', 'ManagerDB');

            const sqlPath = path.join(__dirname, './scripts/sql/init.sql');

            if (!fs.existsSync(sqlPath)) {
                throw new Error(`SQL init file not found at: ${sqlPath}`);
            }

            const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

            await sql.raw(sqlContent).execute(this.db);

            logger.info('Database initialized and schemas verified.', 'ManagerDB');
        } catch (error) {
            logger.error('Failed to initialize Database', 'ManagerDB', error);
        }
    }

    async close() {
        await this.db.destroy();
    }
}

export const managerDb = new ManagerDb();
