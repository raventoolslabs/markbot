export interface User2faTotp {
    userId: string;
    secretEncrypted: string;
    createdAt: Date;
    verifiedAt: Date | null;
    lastUsedAt: Date | null;
}
