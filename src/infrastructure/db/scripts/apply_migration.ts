
import { managerDb } from '@/infrastructure/db/client';
import { sql } from 'kysely';
import fs from 'fs';
import path from 'path';
import { logger } from '@/infrastructure/logging/logger';

async function applyMigration() {
    try {
        await managerDb.initialize(); // Ensure DB is connected
        // Hack: initialize() might run init.sql which is not what we want if we already have a DB,
        // but it's fine for now as init.sql uses IF NOT EXISTS.
        // Better to just access the db instance directly if we could, but initialize is needed for connection.

        const migrationPath = path.join(__dirname, './sql/migration_auth_evolution.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

        logger.info('Applying migration...', 'MigrationScript');
        await sql.raw(migrationSql).execute(managerDb.db);
        logger.info('Migration applied successfully.', 'MigrationScript');

        await managerDb.close();
    } catch (error) {
        logger.error('Migration failed', 'MigrationScript', error);
        process.exit(1);
    }
}

applyMigration();
