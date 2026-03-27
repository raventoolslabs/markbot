import { User } from '@/domain/entities/User';
import { UserRow } from '../schema/UserRow';

export const mapUserRowToUser = (row: UserRow): User => ({
    id: row.id,
    email: row.email,
    name: row.name,
    googleId: row.google_id,
    creationDate: row.creation_date,
    lastLogin: row.last_login,
    passwordHash: row.password_hash,
    passwordSetAt: row.password_set_at,
    passwordChangedAt: row.password_changed_at,
    emailVerified: row.email_verified !== undefined ? row.email_verified : row.verified_at !== null,
    failedLoginCount: row.failed_login_count,
    lastFailedLoginAt: row.last_failed_login_at,
    lockedUntil: row.locked_until,
    twoFactorEnabled: row.two_factor_enabled,
    twoFactorEnrolledAt: row.two_factor_enrolled_at,
    twoFactorSecret: row.two_factor_secret,
    verifiedAt: row.verified_at,
});

export const mapUserToUserRow = (user: User): UserRow => ({
    id: user.id,
    email: user.email,
    name: user.name,
    google_id: user.googleId,
    creation_date: user.creationDate,
    last_login: user.lastLogin,
    password_hash: user.passwordHash,
    password_set_at: user.passwordSetAt,
    password_changed_at: user.passwordChangedAt,
    // We don't map email_verified back to the DB row in mapUserToUserRow since verified_at handles it
    failed_login_count: user.failedLoginCount,
    last_failed_login_at: user.lastFailedLoginAt,
    locked_until: user.lockedUntil,
    two_factor_enabled: user.twoFactorEnabled,
    two_factor_enrolled_at: user.twoFactorEnrolledAt,
    two_factor_secret: user.twoFactorSecret,
    verified_at: user.verifiedAt,
});
