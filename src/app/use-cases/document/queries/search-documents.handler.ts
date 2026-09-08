import { SearchDocumentsQuery } from './search-documents.query';
import { DocumentChunkRepository } from '@/app/ports/repositories/document-chunk.repository';
import { vectorUtil } from '@/infrastructure/utils/vector.util';
import { SearchResult } from '@/domain/entities/SearchResult';
import { logger } from '@/infrastructure/logging/logger';

export class SearchDocumentsHandler {
    constructor(private documentChunkRepository: DocumentChunkRepository) { }

    async execute(query: SearchDocumentsQuery): Promise<SearchResult[]> {
        const queryEmbedding = await vectorUtil.embedText(query.query);
        const vectorString = `[${queryEmbedding.join(',')}]`;

        const limit = query.limit || 5;
        const results = await this.documentChunkRepository.search(vectorString, limit);

        if (results.length > 0) {
            const chunkIds = results.map((row) => row.id).join(', ');
            logger.info(`[DEBUG] Search found ${results.length} chunks. IDs: ${chunkIds}`, 'SearchDocumentsHandler');
        } else {
            logger.info('[DEBUG] Search found 0 chunks.', 'SearchDocumentsHandler');
        }

        return results;
    }
}
