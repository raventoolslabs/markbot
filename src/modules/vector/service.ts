import { pipeline } from '@huggingface/transformers';
import { logger } from '../../util/logger';
import { documentProcessor } from './processor';
import { semanticChunker } from './chunking';
import { sql } from 'kysely';
import { documentDao } from '../../dao/documentDao';
import { documentChunkDao } from '../../dao/documentChunkDao';

export class VectorService {

    private extractor: any = null;

    private readonly modelName = 'Xenova/all-MiniLM-L6-v2';

    constructor() { }

    private async getExtractor() {
        if (!this.extractor) {
            logger.info(`Loading model ${this.modelName}...`, 'VectorService');
            this.extractor = await pipeline('feature-extraction', this.modelName);
            logger.info('Model loaded successfully.', 'VectorService');
        }
        return this.extractor;
    }

    async processFile(buffer: Buffer, originalName: string, mimeType: string) {
        let text = '';

        try {
            if (mimeType === 'application/pdf') {
                text = await documentProcessor.convertPdfToMarkdown(buffer, originalName);
            } else if (mimeType === 'text/markdown' || originalName.endsWith('.md')) {
                text = buffer.toString('utf-8');
                // Save persistence copy for direct markdown uploads
                await documentProcessor.savePersistedMarkdown(text, originalName);
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

        await documentDao.create({
            id: docId,
            organization: 'default',
            path: originalName,
            metadata: docMetadata
        });

        logger.info(`Created document record with ID: ${docId}`, 'VectorService');

        // Use semantic chunker
        const chunks = semanticChunker.chunkMarkdown(text);
        const extractor = await this.getExtractor();

        for (const chunk of chunks) {
            // Generate embedding
            const output = await extractor(chunk.content, { pooling: 'mean', normalize: true });
            const embedding = Array.from(output.data);
            const embeddingVector = `[${embedding.join(',')}]`;

            const metadata = {
                ...chunk.metadata,
                document_id: docId,
                source: originalName,
                timestamp: new Date().toISOString()
            };

            // Insert chunk with embedding
            await documentChunkDao.create({
                document_id: docId,
                content: chunk.content,
                metadata: metadata,
                embedding: sql`${embeddingVector}::vector`
            });
        }

        logger.info(`File ${originalName} processed into ${chunks.length} chunks.`, 'VectorService');
        return { chunks: chunks.length, documentId: docId };
    }

    async search(query: string, limit: number = 5) {
        const extractor = await this.getExtractor();
        const output = await extractor(query, { pooling: 'mean', normalize: true });
        const queryEmbedding = Array.from(output.data);
        const vectorString = `[${queryEmbedding.join(',')}]`;

        const results = await documentChunkDao.search(vectorString, limit);

        if (results.length > 0) {
            const chunkIds = results.map((row: any) => row.id).join(', ');
            logger.info(`[DEBUG] Search found ${results.length} chunks. IDs: ${chunkIds}`, 'VectorService');
        } else {
            logger.info('[DEBUG] Search found 0 chunks.', 'VectorService');
        }

        return results;
    }

    async listDocuments() {
        return await documentDao.list();
    }

    async getDocument(id: string) {
        const doc = await documentDao.getById(id);

        if (!doc) return null;

        // Fetch chunks without embedding
        const chunks = await documentChunkDao.getByDocumentId(id);

        return {
            ...doc,
            chunks: chunks
        };
    }

    async deleteDocument(id: string) {
        await documentDao.delete(id);
        logger.info(`Deleted document with ID: ${id}`, 'VectorService');
    }
}

export const vectorService = new VectorService();
