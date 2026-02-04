import { managerDb } from '@/infrastructure/db/client';
import { sql } from 'kysely';
import { SearchResultDto } from '@/api/http/types/SearchResultDto';

export class DocumentChunkRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create(chunk: any): Promise<{ id: number }> {
    const result = await managerDb.db
      .withSchema('markbot')
      .insertInto('documentchunk')
      .values(chunk)
      .returning('id')
      .executeTakeFirstOrThrow();

    return { id: Number(result.id) };
  }

  async getByDocumentId(documentId: string) {
    return await managerDb.db
      .withSchema('markbot')
      .selectFrom('documentchunk')
      .select(['id', 'content', 'metadata'])
      .where('document_id', '=', documentId)
      .orderBy('id', 'asc')
      .execute();
  }

  async search(vectorString: string, limit: number) {
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
    const resultsWithAssets: SearchResultDto[] = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.map(async (row: any) => {
        const assets = await documentChunkAssetRepository.getByChunkId(row.id);
        return {
          id: Number(row.id),
          content: row.content,
          metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {},
          source_path: row.source_path,
          document_id: row.document_id,
          similarity: Number(row.similarity),
          assets,
        };
      }),
    );

    return resultsWithAssets;
  }
}

export const documentChunkRepository = new DocumentChunkRepository();
