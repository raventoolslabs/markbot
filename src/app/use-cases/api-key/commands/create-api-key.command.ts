export interface CreateApiKeyCommand {
    userId: string;
    name: string;
    expirationDate?: Date;
    domain?: string;
}
