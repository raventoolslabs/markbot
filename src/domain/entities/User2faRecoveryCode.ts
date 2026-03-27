export interface User2faRecoveryCode {
    id: string;
    userId: string;
    codeHash: string;
    createdAt: Date;
    usedAt: Date | null;
}
