export interface ChunkMetadataDto {
    source?: string;
    section?: string;
    section_path?: string[];
    page?: number;
    chunk?: number;
    content_hash?: string;
    [key: string]: any;
}
