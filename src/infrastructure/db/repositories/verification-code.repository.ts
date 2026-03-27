import { managerDb } from '@/infrastructure/db/client';
import { UserVerificationCodeRow } from '../schema/UserVerificationCodeRow';
import { VerificationCode } from '@/domain/entities/VerificationCode';
import { VerificationCodeRepository } from '@/app/ports/repositories/verification-code.repository';
import { mapVerificationCodeRowToEntity, mapEntityToVerificationCodeRow } from '../mappers/verification-code.mapper';

export class PgVerificationCodeRepository implements VerificationCodeRepository {
    async create(data: Omit<VerificationCode, 'id' | 'createdAt'>): Promise<VerificationCode> {
        const rowData = mapEntityToVerificationCodeRow(data);
        const row = await managerDb.db
            .withSchema('markbot')
            .insertInto('user_verification_code')
            .values(rowData)
            .returningAll()
            .executeTakeFirstOrThrow();
        return mapVerificationCodeRowToEntity(row);
    }

    async findValidCode(userId: string, code: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'): Promise<VerificationCode | undefined> {
        const row = await managerDb.db
            .withSchema('markbot')
            .selectFrom('user_verification_code')
            .selectAll()
            .where('user_id', '=', userId)
            .where('code', '=', code)
            .where('type', '=', type)
            .where('expires_at', '>', new Date())
            .executeTakeFirst();
        return row ? mapVerificationCodeRowToEntity(row) : undefined;
    }

    async deleteCode(id: string): Promise<void> {
        await managerDb.db
            .withSchema('markbot')
            .deleteFrom('user_verification_code')
            .where('id', '=', id)
            .execute();
    }

    async deleteByUserAndType(userId: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'): Promise<void> {
        await managerDb.db
            .withSchema('markbot')
            .deleteFrom('user_verification_code')
            .where('user_id', '=', userId)
            .where('type', '=', type)
            .execute();
    }
}

export const verificationCodeRepository = new PgVerificationCodeRepository();
