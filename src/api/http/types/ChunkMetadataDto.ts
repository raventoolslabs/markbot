export interface ChunkMetadataDto {
  source?: string;
  section?: string;
  section_path?: string[];
  page?: number;
  chunk?: number;
  chunk_size?: number;
  content_hash?: string;
  [key: string]: unknown;
}
