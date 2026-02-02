import { managerDb } from '@/infrastructure/db/client';
import { sql } from 'kysely';

export class DocumentChunkRepository {
    async create(chunk: any) {
        await managerDb.db.withSchema('markbot')
            .insertInto('documentchunk')
            .values(chunk)
            .execute();
    }

    async getByDocumentId(documentId: string) {
        return await managerDb.db.withSchema('markbot')
            .selectFrom('documentchunk')
            .select(['id', 'content', 'metadata'])
            .where('document_id', '=', documentId)
            .orderBy('id', 'asc')
            .execute();
    }

    async search(vectorString: string, limit: number) {
        return await managerDb.db.withSchema('markbot')
            .selectFrom('documentchunk as c')
            .innerJoin('document as d', 'c.document_id', 'd.id')
            .select([
                'c.id',
                'c.content',
                'c.metadata',
                'd.path as source_path',
                'd.id as document_id',
                sql<number>`1 - (c.embedding <=> ${vectorString}::vector)`.as('similarity')
            ])
            .orderBy(sql`c.embedding <=> ${vectorString}::vector`)
            .limit(limit)
            .execute();
    }
}

export const documentChunkRepository = new DocumentChunkRepository();
