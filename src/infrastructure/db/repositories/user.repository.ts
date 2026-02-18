import { managerDb } from '@/infrastructure/db/client';
import { UserRow } from '../schema/UserRow';

export class UserRepository {
    async findByEmail(email: string): Promise<UserRow | undefined> {
        return await managerDb.db
            .withSchema('markbot')
            .selectFrom('user')
            .selectAll()
            .where('email', '=', email)
            .executeTakeFirst();
    }

    async findById(id: string): Promise<UserRow | undefined> {
        return await managerDb.db
            .withSchema('markbot')
            .selectFrom('user')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst();
    }

    async create(user: UserRow): Promise<UserRow> {
        await managerDb.db
            .withSchema('markbot')
            .insertInto('user')
            .values(user)
            .execute();
        return user;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async update(id: string, data: Partial<UserRow>): Promise<void> {
        await managerDb.db
            .withSchema('markbot')
            .updateTable('user')
            .set(data as any) // Kysely types can be tricky with partial updates depending on how they are generated, sticking to what works or 'any' if strictness fails.
            // But ideally we should use strict types. Let's try without 'any' first if possible, but safe fallback is Partial<UserRow> cast.
            // Actually standard Kysely .set() takes Updateable<UserRow>.
            .where('id', '=', id)
            .execute();
    }

    async delete(id: string): Promise<void> {
        await managerDb.db
            .withSchema('markbot')
            .deleteFrom('user')
            .where('id', '=', id)
            .execute();
    }
}

export const userRepository = new UserRepository();
