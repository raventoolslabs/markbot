export interface DocumentChunk {
    id: number;
    content: string;
    page?: number;
    section?: string;
    headingPath: string[];
    length: number;
}
