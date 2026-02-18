import { managerDb } from '@/infrastructure/db/client';
import { UserVerificationCodeRow } from '../schema/UserVerificationCodeRow';
import { Selectable } from 'kysely';

export class VerificationCodeRepository {
    async create(data: Omit<UserVerificationCodeRow, 'id' | 'created_at'>): Promise<Selectable<UserVerificationCodeRow>> {
        return await managerDb.db
            .withSchema('markbot')
            .insertInto('user_verification_code')
            .values(data)
            .returningAll()
            .executeTakeFirstOrThrow();
    }

    async findValidCode(userId: string, code: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'): Promise<Selectable<UserVerificationCodeRow> | undefined> {
        return await managerDb.db
            .withSchema('markbot')
            .selectFrom('user_verification_code')
            .selectAll()
            .where('user_id', '=', userId)
            .where('code', '=', code)
            .where('type', '=', type)
            .where('expires_at', '>', new Date())
            .executeTakeFirst();
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

export const verificationCodeRepository = new VerificationCodeRepository();
