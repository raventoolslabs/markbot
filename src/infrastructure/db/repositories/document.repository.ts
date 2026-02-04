import { managerDb } from '@/infrastructure/db/client';

export class DocumentRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create(doc: any): Promise<void> {
    await managerDb.db.withSchema('markbot').insertInto('document').values(doc).execute();
  }

  async list() {
    return await managerDb.db
      .withSchema('markbot')
      .selectFrom('document')
      .selectAll()
      .orderBy('creation_date', 'desc')
      .execute();
  }

  async getById(id: string) {
    return await managerDb.db
      .withSchema('markbot')
      .selectFrom('document')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async delete(id: string) {
    await managerDb.db.withSchema('markbot').deleteFrom('document').where('id', '=', id).execute();
  }
}

export const documentRepository = new DocumentRepository();
