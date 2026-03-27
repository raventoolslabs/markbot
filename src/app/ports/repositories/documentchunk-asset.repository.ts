import { DocumentChunkAsset } from '@/domain/entities/DocumentChunkAsset';

export interface DocumentChunkAssetRepository {
    create(asset: DocumentChunkAsset): Promise<void>;
    getByChunkId(chunkId: number): Promise<DocumentChunkAsset[]>;
    getByDocumentId(documentId: string): Promise<DocumentChunkAsset[]>;
    deleteByDocumentId(documentId: string): Promise<void>;
}
