import { sql } from 'kysely';

import { logger } from '@/infrastructure/logging/logger';
import { documentRepository } from '@/infrastructure/db/repositories/document.repository';
import { documentChunkRepository } from '@/infrastructure/db/repositories/document-chunk.repository';
import { markdownUtil } from '@/infrastructure/utils/markwdown.util';
import { vectorUtil } from '@/infrastructure/utils/vector.util';

export class DocumentController {

    private readonly modelName = 'Xenova/all-MiniLM-L6-v2';

    constructor() { }

    async processFile(buffer: Buffer, originalName: string, mimeType: string) {
        let text = '';

        try {
            if (mimeType === 'application/pdf') {
                text = await markdownUtil.convertPdfToMarkdown(buffer, originalName);
            } else if (mimeType === 'text/markdown' || originalName.endsWith('.md')) {
                text = buffer.toString('utf-8');
                // Save persistence copy for direct markdown uploads
                await markdownUtil.savePersistedMarkdown(text, originalName);
            } else {
                throw new Error(`Unsupported file type: ${mimeType}`);
            }
        } catch (error) {
            logger.error(`Error converting file ${originalName}: ${error}`, 'VectorService');
            throw error;
        }

        if (!text || text.trim().length === 0) {
            throw new Error('Could not extract text from file');
        }

        logger.info(`Processing file: ${originalName} (${text.length} chars)`, 'VectorService');

        // 1. Create parent document record
        const docId = crypto.randomUUID();
        const docMetadata = {
            originalName,
            mimeType,
            size: buffer.length,
            processedAt: new Date().toISOString()
        };

        await documentRepository.create({
            id: docId,
            organization: 'default',
            path: originalName,
            metadata: docMetadata
        });

        logger.info(`Created document record with ID: ${docId}`, 'VectorService');

        const chunks = await vectorUtil.processDocument(text);

        for (const chunk of chunks) {

            const metadata = {
                ...chunk.metadata,
                document_id: docId,
                source: originalName,
                timestamp: docMetadata.processedAt
            };

            const embeddingString = `[${chunk.embedding?.join(',')}]`;

            await documentChunkRepository.create({
                document_id: docId,
                content: chunk.content,
                metadata: metadata,
                embedding: sql`${embeddingString}::vector`
            });
        }

        logger.info(`File ${originalName} processed into ${chunks.length} chunks.`, 'VectorService');

        return { chunks: chunks.length, documentId: docId };
    }

    async search(query: string, limit: number = 5) {
        const queryEmbedding = await vectorUtil.embedText(query);
        const vectorString = `[${queryEmbedding.join(',')}]`;

        const results = await documentChunkRepository.search(vectorString, limit);

        if (results.length > 0) {
            const chunkIds = results.map((row: any) => row.id).join(', ');
            logger.info(`[DEBUG] Search found ${results.length} chunks. IDs: ${chunkIds}`, 'VectorService');
        } else {
            logger.info('[DEBUG] Search found 0 chunks.', 'VectorService');
        }

        return results;
    }

    async listDocuments() {
        return await documentRepository.list();
    }

    async getDocument(id: string) {
        const doc = await documentRepository.getById(id);

        if (!doc) return null;

        // Fetch chunks without embedding
        const chunks = await documentChunkRepository.getByDocumentId(id);

        return {
            ...doc,
            chunks: chunks
        };
    }

    async deleteDocument(id: string) {
        await documentRepository.delete(id);
        logger.info(`Deleted document with ID: ${id}`, 'VectorService');
    }
}

export const documentController = new DocumentController();
