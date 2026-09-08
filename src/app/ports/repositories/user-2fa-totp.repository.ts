import { User2faTotp } from '@/domain/entities/User2faTotp';

export interface User2faTotpRepository {
    findByUserId(userId: string): Promise<User2faTotp | undefined>;
    create(data: User2faTotp): Promise<User2faTotp>;
    update(userId: string, data: Partial<User2faTotp>): Promise<void>;
    delete(userId: string): Promise<void>;
}
