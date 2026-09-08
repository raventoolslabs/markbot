export interface ProcessDocumentCommand {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
}

export interface ProcessFileResult {
    type: 'zip' | 'markdown';
    documentsProcessed?: number;
    chunks: number;
    assets: number;
    documentIds?: string[];
    documentId?: string;
}
