export interface User {
    id: string;
    email: string;
    name: string | null;
    googleId: string | null;
    creationDate: Date;
    lastLogin: Date | null;
    passwordHash: string | null;
    passwordSetAt: Date | null;
    passwordChangedAt: Date | null;
    emailVerified: boolean;
    failedLoginCount: number;
    lastFailedLoginAt: Date | null;
    lockedUntil: Date | null;
    twoFactorEnabled: boolean;
    twoFactorEnrolledAt: Date | null;
    twoFactorSecret: string | null;
    verifiedAt: Date | null;
}
