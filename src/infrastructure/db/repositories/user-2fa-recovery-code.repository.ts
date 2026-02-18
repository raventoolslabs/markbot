import { managerDb } from '@/infrastructure/db/client';
import { User2faRecoveryCodeRow } from '../schema/User2faRecoveryCodeRow';

export class User2faRecoveryCodeRepository {
    async findByUserId(userId: string): Promise<User2faRecoveryCodeRow[]> {
        return await managerDb.db
            .withSchema('markbot')
            .selectFrom('user_2fa_recovery_code')
            .selectAll()
            .where('user_id', '=', userId)
            .execute();
    }

    async createMany(codes: User2faRecoveryCodeRow[]): Promise<void> {
        await managerDb.db
            .withSchema('markbot')
            .insertInto('user_2fa_recovery_code')
            .values(codes)
            .execute();
    }

    async markAsUsed(id: string): Promise<void> {
        await managerDb.db
            .withSchema('markbot')
            .updateTable('user_2fa_recovery_code')
            .set({ used_at: new Date() })
            .where('id', '=', id)
            .execute();
    }

    async deleteByUserId(userId: string): Promise<void> {
        await managerDb.db
            .withSchema('markbot')
            .deleteFrom('user_2fa_recovery_code')
            .where('user_id', '=', userId)
            .execute();
    }
}

export const user2faRecoveryCodeRepository = new User2faRecoveryCodeRepository();
