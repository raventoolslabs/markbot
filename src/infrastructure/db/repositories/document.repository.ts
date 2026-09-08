import { managerDb } from '@/infrastructure/db/client';
import { Document } from '@/domain/entities/Document';
import { DocumentRepository } from '@/app/ports/repositories/document.repository';
import { mapDocumentRowToDocument, mapDocumentToDocumentRow } from '../mappers/document.mapper';

export class PgDocumentRepository implements DocumentRepository {
  async create(doc: Document): Promise<void> {
    const row = mapDocumentToDocumentRow(doc);
    await managerDb.db.withSchema('markbot').insertInto('document').values(row).execute();
  }

  async list(): Promise<Document[]> {
    const rows = await managerDb.db
      .withSchema('markbot')
      .selectFrom('document')
      .selectAll()
      .orderBy('creation_date', 'desc')
      .execute();
    return rows.map(mapDocumentRowToDocument);
  }

  async getById(id: string): Promise<Document | undefined> {
    const row = await managerDb.db
      .withSchema('markbot')
      .selectFrom('document')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? mapDocumentRowToDocument(row) : undefined;
  }

  async delete(id: string): Promise<void> {
    await managerDb.db.withSchema('markbot').deleteFrom('document').where('id', '=', id).execute();
  }
}

export const documentRepository = new PgDocumentRepository();
