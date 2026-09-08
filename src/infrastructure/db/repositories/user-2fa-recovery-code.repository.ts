import { managerDb } from '@/infrastructure/db/client';
import { User2faRecoveryCodeRow } from '../schema/User2faRecoveryCodeRow';
import { User2faRecoveryCode } from '@/domain/entities/User2faRecoveryCode';
import { User2faRecoveryCodeRepository } from '@/app/ports/repositories/user-2fa-recovery-code.repository';
import { mapRecoveryCodeRowToEntity, mapEntityToRecoveryCodeRow } from '../mappers/user-2fa-recovery-code.mapper';

export class PgUser2faRecoveryCodeRepository implements User2faRecoveryCodeRepository {
    async findByUserId(userId: string): Promise<User2faRecoveryCode[]> {
        const rows = await managerDb.db
            .withSchema('markbot')
            .selectFrom('user_2fa_recovery_code')
            .selectAll()
            .where('user_id', '=', userId)
            .execute();
        return rows.map(mapRecoveryCodeRowToEntity);
    }

    async createMany(codes: User2faRecoveryCode[]): Promise<void> {
        const rows = codes.map(mapEntityToRecoveryCodeRow);
        await managerDb.db
            .withSchema('markbot')
            .insertInto('user_2fa_recovery_code')
            .values(rows)
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

export const user2faRecoveryCodeRepository = new PgUser2faRecoveryCodeRepository();
