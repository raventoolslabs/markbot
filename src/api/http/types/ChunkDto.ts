import { ChunkMetadataDto } from './ChunkMetadataDto';

export interface ChunkDto {
    content: string;
    metadata: ChunkMetadataDto;
    embedding?: number[];
}
