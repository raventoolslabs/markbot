export interface DocumentAssetDto {
    id?: number;
    document_id: string;
    chunk_id?: number;
    asset_type: 'image' | 'file';
    asset_name: string;
    mime_type?: string;
    content: string; // base64 encoded
    metadata?: Record<string, any>;
}
