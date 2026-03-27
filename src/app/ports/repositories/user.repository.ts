import { User } from '@/domain/entities/User';

export interface UserRepository {
    findByEmail(email: string): Promise<User | undefined>;
    findById(id: string): Promise<User | undefined>;
    create(user: User): Promise<User>;
    update(id: string, data: Partial<User>): Promise<void>;
    delete(id: string): Promise<void>;
}
