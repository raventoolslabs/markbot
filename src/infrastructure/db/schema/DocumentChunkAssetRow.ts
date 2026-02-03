export interface DocumentChunkAssetRow {
    id?: number;
    document_id: string;
    chunk_id: number | null;
    asset_type: string;
    asset_name: string;
    mime_type: string | null;
    content: string;
    metadata: any;
    creation_date?: Date;
}
