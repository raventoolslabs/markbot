import { User2faRecoveryCode } from '@/domain/entities/User2faRecoveryCode';
import { User2faRecoveryCodeRow } from '../schema/User2faRecoveryCodeRow';

export const mapRecoveryCodeRowToEntity = (row: any): User2faRecoveryCode => ({
    id: row.id as string,
    userId: row.user_id,
    codeHash: row.code_hash,
    createdAt: row.created_at as Date,
    usedAt: row.used_at as Date | null,
});

export const mapEntityToRecoveryCodeRow = (entity: User2faRecoveryCode): any => ({
    id: entity.id,
    user_id: entity.userId,
    code_hash: entity.codeHash,
    created_at: entity.createdAt,
    used_at: entity.usedAt,
});
