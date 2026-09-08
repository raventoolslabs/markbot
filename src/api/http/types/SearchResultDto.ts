import { DocumentAssetDto } from './DocumentAssetDto';

export interface SearchResultDto {
  id: number;
  content: string;
  metadata: Record<string, unknown>;
  source_path: string;
  document_id: string;
  similarity: number;
  assets: DocumentAssetDto[];
}
