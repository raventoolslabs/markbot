import { DocumentChunk } from '@/domain/entities/DocumentChunk';
import { DocumentChunkRow } from '../schema/DocumentChunkRow';

export const mapDocumentChunkRowToDocumentChunk = (row: any): DocumentChunk => ({
    id: row.id as string,
    documentId: row.document_id,
    content: row.content,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    embedding: row.embedding,
});

export const mapDocumentChunkToDocumentChunkRow = (entity: DocumentChunk): any => ({
    id: entity.id,
    document_id: entity.documentId,
    content: entity.content,
    metadata: typeof entity.metadata === 'string' ? entity.metadata : JSON.stringify(entity.metadata || {}),
    embedding: entity.embedding,
});
