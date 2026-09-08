import { ApiKey, CreateApiKeyDTO } from '@/domain/entities/ApiKey';

export interface ApiKeyRepository {
    create(data: CreateApiKeyDTO): Promise<{ apiKey: ApiKey; keySecret: string }>;
    findByUserId(userId: string): Promise<ApiKey[]>;
    delete(id: string, userId: string): Promise<boolean>;
    findByKeyHash(keyHash: string): Promise<ApiKey | null>;
}
