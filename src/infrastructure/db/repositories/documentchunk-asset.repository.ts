import { managerDb } from '@/infrastructure/db/client';
import { DocumentAssetDto } from '@/api/http/types/DocumentAssetDto';

export class DocumentChunkAssetRepository {
  async create(asset: DocumentAssetDto): Promise<void> {
    await managerDb.db
      .withSchema('markbot')
      .insertInto('documentchunkasset')
      .values({
        document_id: asset.document_id,
        chunk_id: asset.chunk_id || null,
        asset_type: asset.asset_type,
        asset_name: asset.asset_name,
        mime_type: asset.mime_type || null,
        content: asset.content,
        metadata: JSON.stringify(asset.metadata || {}),
      })
      .execute();
  }

  async getByChunkId(chunkId: number): Promise<DocumentAssetDto[]> {
    const results = await managerDb.db
      .withSchema('markbot')
      .selectFrom('documentchunkasset')
      .selectAll()
      .where('chunk_id', '=', chunkId)
      .execute();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return results.map((row: any) => ({
      id: Number(row.id),
      document_id: row.document_id,
      chunk_id: row.chunk_id ? Number(row.chunk_id) : undefined,
      asset_type: row.asset_type as 'image' | 'file',
      asset_name: row.asset_name,
      mime_type: row.mime_type || undefined,
      content: row.content,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    }));
  }

  async getByDocumentId(documentId: string): Promise<DocumentAssetDto[]> {
    const results = await managerDb.db
      .withSchema('markbot')
      .selectFrom('documentchunkasset')
      .selectAll()
      .where('document_id', '=', documentId)
      .execute();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return results.map((row: any) => ({
      id: Number(row.id),
      document_id: row.document_id,
      chunk_id: row.chunk_id ? Number(row.chunk_id) : undefined,
      asset_type: row.asset_type as 'image' | 'file',
      asset_name: row.asset_name,
      mime_type: row.mime_type || undefined,
      content: row.content,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    }));
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    await managerDb.db
      .withSchema('markbot')
      .deleteFrom('documentchunkasset')
      .where('document_id', '=', documentId)
      .execute();
  }
}

export const documentChunkAssetRepository = new DocumentChunkAssetRepository();
