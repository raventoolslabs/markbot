export interface DocumentChunk {
    id: string | number;
    documentId: string;
    content: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    embedding: any;
}
