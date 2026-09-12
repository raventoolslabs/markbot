import { managerDb } from '@/infrastructure/db/client';
import { UserRow } from '../schema/UserRow';
import { User } from '@/domain/entities/User';
import { UserRepository } from '@/app/ports/repositories/user.repository';
import { mapUserRowToUser, mapUserToUserRow } from '../mappers/user.mapper';

export class PgUserRepository implements UserRepository {
    async findByEmail(email: string): Promise<User | undefined> {
        const row = await managerDb.db
            .withSchema('markbot')
            .selectFrom('user')
            .selectAll()
            .where('email', '=', email)
            .executeTakeFirst();
        return row ? mapUserRowToUser(row) : undefined;
    }

    async findById(id: string): Promise<User | undefined> {
        const row = await managerDb.db
            .withSchema('markbot')
            .selectFrom('user')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst();
        return row ? mapUserRowToUser(row) : undefined;
    }

    async create(user: User): Promise<User> {
        const row = mapUserToUserRow(user);
        await managerDb.db
            .withSchema('markbot')
            .insertInto('user')
            .values(row)
            .execute();
        return user;
    }

    async update(id: string, data: Partial<User>): Promise<void> {
        const updateData: Partial<UserRow> = {};
        if (data.email !== undefined) updateData.email = data.email;
        if (data.name !== undefined) updateData.name = data.name;
        if (data.googleId !== undefined) updateData.google_id = data.googleId;
        if (data.lastLogin !== undefined) updateData.last_login = data.lastLogin;
        if (data.passwordHash !== undefined) updateData.password_hash = data.passwordHash;
        if (data.passwordSetAt !== undefined) updateData.password_set_at = data.passwordSetAt;
        if (data.passwordChangedAt !== undefined) updateData.password_changed_at = data.passwordChangedAt;
        if (data.failedLoginCount !== undefined) updateData.failed_login_count = data.failedLoginCount;
        if (data.lastFailedLoginAt !== undefined) updateData.last_failed_login_at = data.lastFailedLoginAt;
        if (data.lockedUntil !== undefined) updateData.locked_until = data.lockedUntil;
        if (data.twoFactorEnabled !== undefined) updateData.two_factor_enabled = data.twoFactorEnabled;
        if (data.twoFactorEnrolledAt !== undefined) updateData.two_factor_enrolled_at = data.twoFactorEnrolledAt;
        if (data.twoFactorSecret !== undefined) updateData.two_factor_secret = data.twoFactorSecret;
        // init.sql no tiene email_verified: la verificación se guarda como fecha en verified_at.
        if (data.emailVerified !== undefined) updateData.verified_at = data.emailVerified ? new Date() : null;
        if (data.verifiedAt !== undefined) updateData.verified_at = data.verifiedAt;

        await managerDb.db
            .withSchema('markbot')
            .updateTable('user')
            .set(updateData)
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

export const userRepository = new PgUserRepository();
