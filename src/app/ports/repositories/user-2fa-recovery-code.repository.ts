import { User2faRecoveryCode } from '@/domain/entities/User2faRecoveryCode';

export interface User2faRecoveryCodeRepository {
    findByUserId(userId: string): Promise<User2faRecoveryCode[]>;
    createMany(codes: User2faRecoveryCode[]): Promise<void>;
    markAsUsed(id: string): Promise<void>;
    deleteByUserId(userId: string): Promise<void>;
}
