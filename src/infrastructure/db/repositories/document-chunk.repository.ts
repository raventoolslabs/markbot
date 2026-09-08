import { managerDb } from '@/infrastructure/db/client';
import { sql } from 'kysely';
import { SearchResult } from '@/domain/entities/SearchResult';
import { DocumentChunk } from '@/domain/entities/DocumentChunk';
import { DocumentChunkRepository } from '@/app/ports/repositories/document-chunk.repository';
import { mapDocumentChunkRowToDocumentChunk, mapDocumentChunkToDocumentChunkRow } from '../mappers/document-chunk.mapper';

export class PgDocumentChunkRepository implements DocumentChunkRepository {
  async create(chunk: DocumentChunk): Promise<{ id: number }> {
    const row = mapDocumentChunkToDocumentChunkRow(chunk);
    // don't insert ID if it's missing or we expect DB to sequence it
    if (!row.id) delete row.id;

    const result = await managerDb.db
      .withSchema('markbot')
      .insertInto('documentchunk')
      .values(row)
      .returning('id')
      .executeTakeFirstOrThrow();

    return { id: Number(result.id) };
  }

  async getByDocumentId(documentId: string): Promise<DocumentChunk[]> {
    const rows = await managerDb.db
      .withSchema('markbot')
      .selectFrom('documentchunk')
      .select(['id', 'content', 'metadata', 'document_id', 'embedding'])
      .where('document_id', '=', documentId)
      .orderBy('id', 'asc')
      .execute();
    return rows.map(mapDocumentChunkRowToDocumentChunk);
  }

  async search(vectorString: string, limit: number): Promise<SearchResult[]> {
    const results = await managerDb.db
      .withSchema('markbot')
      .selectFrom('documentchunk as c')
      .innerJoin('document as d', 'c.document_id', 'd.id')
      .select([
        'c.id',
        'c.content',
        'c.metadata',
        'd.path as source_path',
        'd.id as document_id',
        sql<number>`1 - (c.embedding <=> ${vectorString}::vector)`.as('similarity'),
      ])
      .orderBy(sql`c.embedding <=> ${vectorString}::vector`)
      .limit(limit)
      .execute();

    // Import the repository here to avoid circular dependencies
    const { documentChunkAssetRepository } = await import('./documentchunk-asset.repository');

    // Fetch assets for each chunk
    const resultsWithAssets: SearchResult[] = await Promise.all(
      results.map(async (row: any) => {
        const assets = await documentChunkAssetRepository.getByChunkId(Number(row.id));
        return {
          id: Number(row.id),
          content: row.content,
          metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {},
          sourcePath: row.source_path,
          documentId: row.document_id,
          similarity: Number(row.similarity),
          assets,
        };
      }),
    );

    return resultsWithAssets;
  }
}

export const documentChunkRepository = new PgDocumentChunkRepository();
