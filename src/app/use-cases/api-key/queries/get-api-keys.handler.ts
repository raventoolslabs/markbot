import { GetApiKeysQuery } from './get-api-keys.query';
import { ApiKeyRepository } from '@/app/ports/repositories/api-key.repository';
import { ApiKey } from '@/domain/entities/ApiKey';

export class GetApiKeysHandler {
    constructor(private apiKeyRepository: ApiKeyRepository) { }

    async execute(query: GetApiKeysQuery): Promise<ApiKey[]> {
        return await this.apiKeyRepository.findByUserId(query.userId);
    }
}
