export interface SearchResult {
    documentId: string;
    content: string;
    page?: number;
    section?: string;
    headingPath: string[];
    similarity: number;
}
