import { GetDocumentQuery } from './get-document.query';
import { DocumentRepository } from '@/app/ports/repositories/document.repository';
import { Document } from '@/domain/entities/Document';
import { DocumentChunk } from '@/domain/entities/DocumentChunk';

export class GetDocumentHandler {
    constructor(private documentRepository: DocumentRepository) { }

    async execute(query: GetDocumentQuery): Promise<(Document & { chunks: DocumentChunk[] }) | null> {
        const doc = await this.documentRepository.getById(query.id);

        if (!doc) return null;

        const chunks = await this.documentRepository.getChunks(query.id);

        return { ...doc, chunks };
    }
}
