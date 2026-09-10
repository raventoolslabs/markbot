import { SearchDocumentsQuery } from './search-documents.query';
import { DocumentRepository } from '@/app/ports/repositories/document.repository';

export interface SearchDocumentsResult {
    content: string;
    documentName: string;
    section: string;
}

export class SearchDocumentsHandler {
    constructor(private documentRepository: DocumentRepository) { }

    async execute(query: SearchDocumentsQuery): Promise<SearchDocumentsResult[]> {
        const results = await this.documentRepository.search(query.query, query.limit || 5);

        // /search no trae el nombre del documento.
        // ponytail: una petición por documento; caché de nombres si la latencia duele
        const ids = Array.from(new Set(results.map((result) => result.documentId)));
        const documents = await Promise.all(ids.map((id) => this.documentRepository.getById(id)));
        const names = new Map(ids.map((id, index) => [id, documents[index]?.name ?? 'Documento']));

        return results.map((result) => ({
            content: result.content,
            documentName: names.get(result.documentId) ?? 'Documento',
            section: result.section ?? result.headingPath[result.headingPath.length - 1] ?? 'General',
        }));
    }
}
