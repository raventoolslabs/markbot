import { DocumentChunkAsset } from '@/domain/entities/DocumentChunkAsset';
import { DocumentChunkAssetRow } from '../schema/DocumentChunkAssetRow';

export const mapDocumentChunkAssetRowToEntity = (row: any): DocumentChunkAsset => ({
    id: Number(row.id),
    documentId: row.document_id,
    chunkId: row.chunk_id ? Number(row.chunk_id) : null,
    assetType: row.asset_type,
    assetName: row.asset_name,
    mimeType: row.mime_type,
    content: row.content,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    creationDate: row.creation_date as Date,
});

export const mapEntityToDocumentChunkAssetRow = (entity: DocumentChunkAsset): any => ({
    id: entity.id,
    document_id: entity.documentId,
    chunk_id: entity.chunkId,
    asset_type: entity.assetType,
    asset_name: entity.assetName,
    mime_type: entity.mimeType,
    content: entity.content,
    metadata: typeof entity.metadata === 'string' ? entity.metadata : JSON.stringify(entity.metadata || {}),
    creation_date: entity.creationDate,
});
