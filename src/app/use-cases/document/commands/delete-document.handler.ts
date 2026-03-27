import { DeleteDocumentCommand } from './delete-document.command';
import { DocumentRepository } from '@/app/ports/repositories/document.repository';
import { logger } from '@/infrastructure/logging/logger';

export class DeleteDocumentHandler {
    constructor(private documentRepository: DocumentRepository) { }

    async execute(command: DeleteDocumentCommand): Promise<void> {
        await this.documentRepository.delete(command.id);
        logger.info(`Deleted document with ID: ${command.id}`, 'DeleteDocumentHandler');
    }
}
