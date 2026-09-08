export interface DocumentChunkAsset {
    id?: number;
    documentId: string;
    chunkId: number | null;
    assetType: string;
    assetName: string;
    mimeType: string | null;
    content: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: any;
    creationDate?: Date;
}
