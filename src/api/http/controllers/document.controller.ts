import { sql } from 'kysely';

import { logger } from '@/infrastructure/logging/logger';
import { documentRepository } from '@/infrastructure/db/repositories/document.repository';
import { documentChunkRepository } from '@/infrastructure/db/repositories/document-chunk.repository';
import { documentChunkAssetRepository } from '@/infrastructure/db/repositories/documentchunk-asset.repository';
import { vectorUtil } from '@/infrastructure/utils/vector.util';

export class DocumentController {

    private readonly modelName = 'Xenova/all-MiniLM-L6-v2';

    constructor() { }

    async processFile(buffer: Buffer, originalName: string, mimeType: string) {

        if (mimeType !== 'text/markdown' && !originalName.endsWith('.md')) {
            throw new Error(`Only Markdown files (.md) are supported. Received: ${mimeType}`);
        }

        const text = buffer.toString('utf-8');

        if (!text || text.trim().length === 0) {
            throw new Error('Could not extract text from file');
        }

        const processedDoc = await vectorUtil.processDocument(text);
        const { chunks, assets } = processedDoc;

        logger.info(`Processing file: ${originalName} (${text.length} chars, ${chunks.length} chunks, ${assets.length} assets)`, 'DocumentController');

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

        logger.info(`Created document record with ID: ${docId}`, 'DocumentController');

        const chunkIds: number[] = [];
        for (const chunk of chunks) {

            const metadata = {
                ...chunk.metadata,
                document_id: docId,
                source: originalName,
                timestamp: docMetadata.processedAt
            };

            const embeddingString = `[${chunk.embedding?.join(',')}]`;

            const result = await documentChunkRepository.create({
                document_id: docId,
                content: chunk.content,
                metadata: metadata,
                embedding: sql`${embeddingString}::vector`
            });

            // Store chunk ID for linking assets
            chunkIds.push(result.id);
        }

        // Store assets and link to chunks
        for (const asset of assets) {
            const chunkIndex = asset.metadata?.chunk_index;
            const chunkId = chunkIndex !== undefined && chunkIds[chunkIndex] ? chunkIds[chunkIndex] : undefined;

            await documentChunkAssetRepository.create({
                document_id: docId,
                chunk_id: chunkId,
                asset_type: asset.asset_type,
                asset_name: asset.asset_name,
                mime_type: asset.mime_type,
                content: asset.content,
                metadata: asset.metadata
            });
        }

        logger.info(`File ${originalName} processed: ${chunks.length} chunks, ${assets.length} assets.`, 'DocumentController');

        return { chunks: chunks.length, assets: assets.length, documentId: docId };
    }

    async search(query: string, limit: number = 5) {
        const queryEmbedding = await vectorUtil.embedText(query);
        const vectorString = `[${queryEmbedding.join(',')}]`;

        const results = await documentChunkRepository.search(vectorString, limit);

        if (results.length > 0) {
            const chunkIds = results.map((row: any) => row.id).join(', ');
            logger.info(`[DEBUG] Search found ${results.length} chunks. IDs: ${chunkIds}`, 'DocumentController');
        } else {
            logger.info('[DEBUG] Search found 0 chunks.', 'DocumentController');
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
        logger.info(`Deleted document with ID: ${id}`, 'DocumentController');
    }
}

export const documentController = new DocumentController();
