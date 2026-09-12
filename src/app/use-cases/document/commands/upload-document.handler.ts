import { UploadDocumentCommand } from './upload-document.command';
import { DocumentRepository } from '@/app/ports/repositories/document.repository';
import { Document } from '@/domain/entities/Document';
import { logger } from '@/infrastructure/logging/logger';

export class UploadDocumentHandler {
    constructor(private documentRepository: DocumentRepository) { }

    async execute(command: UploadDocumentCommand): Promise<Document> {
        const document = await this.documentRepository.upload(command);
        logger.info(`Uploaded document ${document.id} (${command.originalName})`, 'UploadDocumentHandler');
        return document;
    }
}
