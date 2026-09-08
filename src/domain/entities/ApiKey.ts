export interface ApiKey {
    id: string;
    userId: string;
    name: string;
    prefix: string;
    expirationDate: Date | null;
    domain: string | null;
    createdAt: Date;
}

export interface CreateApiKeyDTO {
    userId: string;
    name: string;
    expirationDate?: Date;
    domain?: string;
}
