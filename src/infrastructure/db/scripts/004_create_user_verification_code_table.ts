import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .withSchema('markbot')
        .createTable('user_verification_code')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
        .addColumn('user_id', 'varchar(255)', (col) => col.references('markbot.user.id').onDelete('cascade').notNull())
        .addColumn('code', 'varchar(10)', (col) => col.notNull())
        .addColumn('type', 'varchar(50)', (col) => col.notNull()) // 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'
        .addColumn('expires_at', 'timestamp', (col) => col.notNull())
        .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
        .execute();

    // Index for faster lookups
    await db.schema
        .withSchema('markbot')
        .createIndex('idx_user_verification_code_user_id')
        .on('user_verification_code')
        .column('user_id')
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema
        .withSchema('markbot')
        .dropTable('user_verification_code')
        .execute();
}
