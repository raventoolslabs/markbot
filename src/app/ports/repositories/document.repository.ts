import { Document } from '@/domain/entities/Document';

export interface DocumentRepository {
    create(doc: Document): Promise<void>;
    list(): Promise<Document[]>;
    getById(id: string): Promise<Document | undefined>;
    delete(id: string): Promise<void>;
}
