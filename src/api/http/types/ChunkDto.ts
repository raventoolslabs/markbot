import { ChunkMetadataDto } from './ChunkMetadataDto';
import { DocumentAssetDto } from './DocumentAssetDto';

export interface ChunkDto {
    content: string;
    metadata: ChunkMetadataDto;
    embedding?: number[];
    assets?: DocumentAssetDto[];
}
