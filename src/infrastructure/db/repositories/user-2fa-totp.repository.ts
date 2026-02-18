import { managerDb } from '@/infrastructure/db/client';
import { User2faTotpRow } from '../schema/User2faTotpRow';

export class User2faTotpRepository {
    async findByUserId(userId: string): Promise<User2faTotpRow | undefined> {
        return await managerDb.db
            .withSchema('markbot')
            .selectFrom('user_2fa_totp')
            .selectAll()
            .where('user_id', '=', userId)
            .executeTakeFirst();
    }

    async create(data: User2faTotpRow): Promise<User2faTotpRow> {
        await managerDb.db
            .withSchema('markbot')
            .insertInto('user_2fa_totp')
            .values(data)
            .execute();
        return data;
    }

    async update(userId: string, data: Partial<User2faTotpRow>): Promise<void> {
        await managerDb.db
            .withSchema('markbot')
            .updateTable('user_2fa_totp')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .set(data as any)
            .where('user_id', '=', userId)
            .execute();
    }

    async delete(userId: string): Promise<void> {
        await managerDb.db
            .withSchema('markbot')
            .deleteFrom('user_2fa_totp')
            .where('user_id', '=', userId)
            .execute();
    }
}

export const user2faTotpRepository = new User2faTotpRepository();
