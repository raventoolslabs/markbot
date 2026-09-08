import { ProcessDocumentCommand, ProcessFileResult } from './process-document.command';
import { sql } from 'kysely';
import { logger } from '@/infrastructure/logging/logger';
import { DocumentRepository } from '@/app/ports/repositories/document.repository';
import { DocumentChunkRepository } from '@/app/ports/repositories/document-chunk.repository';
import { DocumentChunkAssetRepository } from '@/app/ports/repositories/documentchunk-asset.repository';
import { vectorUtil } from '@/infrastructure/utils/vector.util';
import { zipUtil } from '@/infrastructure/utils/zip.util';
import crypto from 'crypto';

export class ProcessDocumentHandler {
    constructor(
        private documentRepository: DocumentRepository,
        private documentChunkRepository: DocumentChunkRepository,
        private documentChunkAssetRepository: DocumentChunkAssetRepository
    ) { }

    async execute(command: ProcessDocumentCommand): Promise<ProcessFileResult> {
        if (
            command.mimeType === 'application/zip' ||
            command.mimeType === 'application/x-zip-compressed' ||
            command.originalName.toLowerCase().endsWith('.zip')
        ) {
            return this.processZip(command.buffer, command.originalName);
        }

        if (command.mimeType !== 'text/markdown' && !command.originalName.endsWith('.md')) {
            throw new Error(`Only Markdown files (.md) or ZIP archives are supported. Received: ${command.mimeType}`);
        }

        const text = command.buffer.toString('utf-8');
        const result = await this.processSingleMarkdown(text, command.originalName, command.mimeType);

        return {
            type: 'markdown',
            ...result,
        };
    }

    private async processZip(buffer: Buffer, originalName: string): Promise<ProcessFileResult> {
        logger.info(`Processing ZIP file: ${originalName}`, 'ProcessDocumentHandler');

        const processedFiles = await zipUtil.processZipContent(buffer);

        if (processedFiles.length === 0) {
            throw new Error('No valid markdown files found in the ZIP archive');
        }

        const results = [];

        for (const file of processedFiles) {
            try {
                const compoundName = `${originalName}/${file.fileName}`;
                const result = await this.processSingleMarkdown(file.content, compoundName, 'text/markdown');
                results.push(result);
            } catch (err) {
                logger.error(`Error processing file ${file.fileName} from zip: ${err}`, 'ProcessDocumentHandler');
            }
        }

        const totalChunks = results.reduce((sum, r) => sum + r.chunks, 0);
        const totalAssets = results.reduce((sum, r) => sum + r.assets, 0);
        const docIds = results.map((r) => r.documentId);

        logger.info(
            `ZIP processing complete. Documents: ${results.length}, Chunks: ${totalChunks}, Assets: ${totalAssets}`,
            'ProcessDocumentHandler',
        );

        return {
            type: 'zip',
            documentsProcessed: results.length,
            chunks: totalChunks,
            assets: totalAssets,
            documentIds: docIds,
        };
    }

    private async processSingleMarkdown(text: string, originalName: string, mimeType: string) {
        if (!text || text.trim().length === 0) {
            throw new Error('Could not extract text from file');
        }

        const processedDoc = await vectorUtil.processDocument(text);
        const { chunks, assets } = processedDoc;

        logger.info(
            `Processing file: ${originalName} (${text.length} chars, ${chunks.length} chunks, ${assets.length} assets)`,
            'ProcessDocumentHandler',
        );

        const docId = crypto.randomUUID();
        const docMetadata = {
            originalName,
            mimeType,
            size: text.length,
            processedAt: new Date().toISOString(),
        };

        await this.documentRepository.create({
            id: docId,
            organization: 'default', // Might want to make this dynamic if possible
            path: originalName,
            metadata: docMetadata,
            creationDate: new Date(),
            modificationDate: new Date()
        });

        logger.info(`Created document record with ID: ${docId}`, 'ProcessDocumentHandler');

        const chunkIds: number[] = [];

        for (const chunk of chunks) {
            const metadata = {
                ...chunk.metadata,
                document_id: docId,
                source: originalName,
                timestamp: docMetadata.processedAt,
            };

            const embeddingString = `[${chunk.embedding?.join(',')}]`;

            const result = await this.documentChunkRepository.create({
                id: 0,
                documentId: docId, // Assuming map accepts camelCase
                content: chunk.content,
                metadata: metadata,
                // Using any type assertion here because Kysely sql types can be tricky
                embedding: sql`${embeddingString}::vector` as any,
            });

            chunkIds.push(result.id);
        }

        for (const asset of assets) {
            const chunkIndex = asset.metadata?.chunk_index as number | undefined;
            const chunkId = chunkIndex !== undefined && chunkIds[chunkIndex] ? chunkIds[chunkIndex] : null;

            await this.documentChunkAssetRepository.create({
                id: 0,
                documentId: docId,
                chunkId: chunkId,
                assetType: asset.asset_type,
                assetName: asset.asset_name,
                mimeType: asset.mime_type,
                content: asset.content,
                metadata: asset.metadata,
            });
        }

        logger.info(
            `File ${originalName} processed: ${chunks.length} chunks, ${assets.length} assets.`,
            'ProcessDocumentHandler',
        );

        return { chunks: chunks.length, assets: assets.length, documentId: docId };
    }
}
