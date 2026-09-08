import { User2faTotp } from '@/domain/entities/User2faTotp';
import { User2faTotpRow } from '../schema/User2faTotpRow';

export const mapUser2faTotpRowToUser2faTotp = (row: any): User2faTotp => ({
    userId: row.user_id,
    secretEncrypted: row.secret_encrypted,
    createdAt: row.created_at as Date,
    verifiedAt: row.verified_at as Date | null,
    lastUsedAt: row.last_used_at as Date | null,
});

export const mapUser2faTotpToUser2faTotpRow = (entity: User2faTotp): any => ({
    user_id: entity.userId,
    secret_encrypted: entity.secretEncrypted,
    created_at: entity.createdAt,
    verified_at: entity.verifiedAt,
    last_used_at: entity.lastUsedAt,
});
