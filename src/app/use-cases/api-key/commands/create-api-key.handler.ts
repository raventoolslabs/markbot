import { CreateApiKeyCommand } from './create-api-key.command';
import { ApiKeyRepository } from '@/app/ports/repositories/api-key.repository';
import { ApiKey } from '@/domain/entities/ApiKey';

export class CreateApiKeyHandler {
    constructor(private apiKeyRepository: ApiKeyRepository) { }

    async execute(command: CreateApiKeyCommand): Promise<{ apiKey: ApiKey; keySecret: string }> {
        return await this.apiKeyRepository.create({
            userId: command.userId,
            name: command.name,
            expirationDate: command.expirationDate,
            domain: command.domain,
        });
    }
}
