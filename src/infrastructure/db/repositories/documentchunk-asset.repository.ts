import { managerDb } from '@/infrastructure/db/client';
import { DocumentChunkAsset } from '@/domain/entities/DocumentChunkAsset';
import { DocumentChunkAssetRepository } from '@/app/ports/repositories/documentchunk-asset.repository';
import { mapDocumentChunkAssetRowToEntity, mapEntityToDocumentChunkAssetRow } from '../mappers/documentchunk-asset.mapper';

export class PgDocumentChunkAssetRepository implements DocumentChunkAssetRepository {
  async create(asset: DocumentChunkAsset): Promise<void> {
    const row = mapEntityToDocumentChunkAssetRow(asset);
    await managerDb.db
      .withSchema('markbot')
      .insertInto('documentchunkasset')
      .values(row)
      .execute();
  }

  async getByChunkId(chunkId: number): Promise<DocumentChunkAsset[]> {
    const results = await managerDb.db
      .withSchema('markbot')
      .selectFrom('documentchunkasset')
      .selectAll()
      .where('chunk_id', '=', chunkId)
      .execute();

    return results.map(mapDocumentChunkAssetRowToEntity);
  }

  async getByDocumentId(documentId: string): Promise<DocumentChunkAsset[]> {
    const results = await managerDb.db
      .withSchema('markbot')
      .selectFrom('documentchunkasset')
      .selectAll()
      .where('document_id', '=', documentId)
      .execute();

    return results.map(mapDocumentChunkAssetRowToEntity);
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    await managerDb.db
      .withSchema('markbot')
      .deleteFrom('documentchunkasset')
      .where('document_id', '=', documentId)
      .execute();
  }
}

export const documentChunkAssetRepository = new PgDocumentChunkAssetRepository();
