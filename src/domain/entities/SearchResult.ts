import { DocumentChunkAsset } from './DocumentChunkAsset';

export interface SearchResult {
    id: number;
    content: string;
    metadata: Record<string, unknown>;
    sourcePath: string;
    documentId: string;
    similarity: number;
    assets: DocumentChunkAsset[];
}
