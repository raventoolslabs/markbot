import { ListDocumentsQuery } from './list-documents.query';
import { DocumentRepository } from '@/app/ports/repositories/document.repository';
import { Document } from '@/domain/entities/Document';

export class ListDocumentsHandler {
    constructor(private documentRepository: DocumentRepository) { }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async execute(_query: ListDocumentsQuery): Promise<Document[]> {
        return await this.documentRepository.list();
    }
}
