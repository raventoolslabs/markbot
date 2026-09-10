import { Document } from '@/domain/entities/Document';
import { DocumentChunk } from '@/domain/entities/DocumentChunk';
import { SearchResult } from '@/domain/entities/SearchResult';

export interface DocumentFile {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
}

// Los documentos viven en Pergamo: el ámbito lo fija la credencial del adaptador, no quien llama.
export interface DocumentRepository {
    search(query: string, limit: number): Promise<SearchResult[]>;
    list(): Promise<Document[]>;
    getById(id: string): Promise<Document | undefined>;
    getChunks(id: string): Promise<DocumentChunk[]>;
    upload(file: DocumentFile): Promise<Document>;
    delete(id: string): Promise<void>;
}
