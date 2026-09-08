import { GetDocumentQuery } from './get-document.query';
import { DocumentRepository } from '@/app/ports/repositories/document.repository';
import { DocumentChunkRepository } from '@/app/ports/repositories/document-chunk.repository';
import { Document } from '@/domain/entities/Document';
import { DocumentChunk } from '@/domain/entities/DocumentChunk';

export class GetDocumentHandler {
    constructor(
        private documentRepository: DocumentRepository,
        private documentChunkRepository: DocumentChunkRepository
    ) { }

    async execute(query: GetDocumentQuery): Promise<(Document & { chunks: DocumentChunk[] }) | null> {
        const doc = await this.documentRepository.getById(query.id);

        if (!doc) return null;

        const chunks = await this.documentChunkRepository.getByDocumentId(query.id);

        return {
            ...doc,
            chunks: chunks,
        };
    }
}
