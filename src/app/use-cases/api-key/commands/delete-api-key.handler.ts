import { DeleteApiKeyCommand } from './delete-api-key.command';
import { ApiKeyRepository } from '@/app/ports/repositories/api-key.repository';

export class DeleteApiKeyHandler {
    constructor(private apiKeyRepository: ApiKeyRepository) { }

    async execute(command: DeleteApiKeyCommand): Promise<boolean> {
        return await this.apiKeyRepository.delete(command.id, command.userId);
    }
}
