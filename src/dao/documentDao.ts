import { managerDb } from '../util/db';

export class DocumentDao {
    async create(doc: any) {
        await managerDb.db.withSchema('markbot')
            .insertInto('document')
            .values(doc)
            .execute();
    }

    async list() {
        return await managerDb.db.withSchema('markbot')
            .selectFrom('document')
            .selectAll()
            .orderBy('creation_date', 'desc')
            .execute();
    }

    async getById(id: string) {
        return await managerDb.db.withSchema('markbot')
            .selectFrom('document')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst();
    }

    async delete(id: string) {
        await managerDb.db.withSchema('markbot')
            .deleteFrom('document')
            .where('id', '=', id)
            .execute();
    }
}

export const documentDao = new DocumentDao();
