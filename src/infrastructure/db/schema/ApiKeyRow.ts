export interface ApiKeyRow {
    id: string;
    user_id: string;
    key_hash: string;
    name: string;
    prefix: string;
    expiration_date: Date | null;
    domain: string | null;
    created_at: Date;
}
