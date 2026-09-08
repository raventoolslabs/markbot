import { managerDb } from '@/infrastructure/db/client';
import { User2faTotpRow } from '../schema/User2faTotpRow';
import { User2faTotp } from '@/domain/entities/User2faTotp';
import { User2faTotpRepository } from '@/app/ports/repositories/user-2fa-totp.repository';
import { mapUser2faTotpRowToUser2faTotp, mapUser2faTotpToUser2faTotpRow } from '../mappers/user-2fa-totp.mapper';

export class PgUser2faTotpRepository implements User2faTotpRepository {
    async findByUserId(userId: string): Promise<User2faTotp | undefined> {
        const row = await managerDb.db
            .withSchema('markbot')
            .selectFrom('user_2fa_totp')
            .selectAll()
            .where('user_id', '=', userId)
            .executeTakeFirst();
        return row ? mapUser2faTotpRowToUser2faTotp(row) : undefined;
    }

    async create(data: User2faTotp): Promise<User2faTotp> {
        const row = mapUser2faTotpToUser2faTotpRow(data);
        await managerDb.db
            .withSchema('markbot')
            .insertInto('user_2fa_totp')
            .values(row)
            .execute();
        return data;
    }

    async update(userId: string, data: Partial<User2faTotp>): Promise<void> {
        const updateData: Partial<User2faTotpRow> = {};
        if (data.secretEncrypted !== undefined) updateData.secret_encrypted = data.secretEncrypted;
        if (data.verifiedAt !== undefined) updateData.verified_at = data.verifiedAt;
        if (data.lastUsedAt !== undefined) updateData.last_used_at = data.lastUsedAt;

        await managerDb.db
            .withSchema('markbot')
            .updateTable('user_2fa_totp')
            .set(updateData)
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

export const user2faTotpRepository = new PgUser2faTotpRepository();
