import { pipeline } from '@huggingface/transformers';
import pdf = require('pdf-parse');
import { vectorDb } from './db';
import { logger } from '../../util/logger';

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

        if (mimeType === 'application/pdf') {
            const data = await (pdf as any)(buffer);
            text = data.text;
        } else if (mimeType === 'text/markdown' || originalName.endsWith('.md')) {
            text = buffer.toString('utf-8');
        } else {
            throw new Error(`Unsupported file type: ${mimeType}`);
        }

        if (!text || text.trim().length === 0) {
            throw new Error('Could not extract text from file');
        }

        logger.info(`Processing file: ${originalName} (${text.length} chars)`, 'VectorService');

        const chunks = this.splitIntoChunks(text, 1000);
        const extractor = await this.getExtractor();

        for (const chunk of chunks) {
            // Generate embedding
            const output = await extractor(chunk, { pooling: 'mean', normalize: true });
            const embedding = Array.from(output.data);

            await vectorDb.query(
                'INSERT INTO documents (content, metadata, embedding) VALUES ($1, $2, $3)',
                [
                    chunk,
                    JSON.stringify({ source: originalName, timestamp: new Date().toISOString() }),
                    `[${embedding.join(',')}]`
                ]
            );
        }

        logger.info(`File ${originalName} processed into ${chunks.length} chunks.`, 'VectorService');
        return { chunks: chunks.length };
    }

    async search(query: string, limit: number = 5) {
        const extractor = await this.getExtractor();
        const output = await extractor(query, { pooling: 'mean', normalize: true });
        const queryEmbedding = Array.from(output.data);

        // Similarity search using cosine distance (<=> operator in pgvector)
        const result = await vectorDb.query(
            `SELECT content, metadata, 1 - (embedding <=> $1) as similarity 
       FROM documents 
       ORDER BY embedding <=> $1 
       LIMIT $2`,
            [`[${queryEmbedding.join(',')}]`, limit]
        );

        return result.rows;
    }

    private splitIntoChunks(text: string, chunkSize: number): string[] {
        const chunks: string[] = [];
        let current = 0;
        while (current < text.length) {
            chunks.push(text.substring(current, current + chunkSize));
            current += chunkSize;
        }
        return chunks;
    }
}

export const vectorService = new VectorService();
