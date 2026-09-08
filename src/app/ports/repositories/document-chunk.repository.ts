import { DocumentChunk } from '@/domain/entities/DocumentChunk';
import { SearchResult } from '@/domain/entities/SearchResult';

export interface DocumentChunkRepository {
    create(chunk: DocumentChunk): Promise<{ id: number }>;
    getByDocumentId(documentId: string): Promise<DocumentChunk[]>;
    search(vectorString: string, limit: number): Promise<SearchResult[]>;
}
