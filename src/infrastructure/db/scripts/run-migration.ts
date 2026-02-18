import { managerDb } from '@/infrastructure/db/client';
import { up } from './004_create_user_verification_code_table';

async function runMigration() {
    console.log('Starting migration 004...');

    try {
        console.log('Executing Migration 004 up()...');
        await up(managerDb.db);
        console.log('Migration 004 completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await managerDb.close(); // Close connection
    }
}

runMigration();
