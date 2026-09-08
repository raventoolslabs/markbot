import { VerificationCode } from '@/domain/entities/VerificationCode';
import { UserVerificationCodeRow } from '../schema/UserVerificationCodeRow';

export const mapVerificationCodeRowToEntity = (row: any): VerificationCode => ({
    id: String(row.id),
    userId: row.user_id,
    code: row.code,
    type: row.type,
    createdAt: row.created_at as Date,
    expiresAt: row.expires_at,
});

export const mapEntityToVerificationCodeRow = (entity: Omit<VerificationCode, 'id' | 'createdAt'>): any => ({
    user_id: entity.userId,
    code: entity.code,
    type: entity.type as 'EMAIL_VERIFICATION' | 'PASSWORD_RESET',
    expires_at: entity.expiresAt,
});
