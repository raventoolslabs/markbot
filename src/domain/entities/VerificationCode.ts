export interface VerificationCode {
    id: string;
    userId: string;
    code: string;
    type: string;
    createdAt: Date;
    expiresAt: Date;
}
