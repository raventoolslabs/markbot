import { VerificationCode } from '@/domain/entities/VerificationCode';

export interface VerificationCodeRepository {
    create(data: Omit<VerificationCode, 'id' | 'createdAt'>): Promise<VerificationCode>;
    findValidCode(userId: string, code: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'): Promise<VerificationCode | undefined>;
    deleteCode(id: string): Promise<void>;
    deleteByUserAndType(userId: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'): Promise<void>;
}
