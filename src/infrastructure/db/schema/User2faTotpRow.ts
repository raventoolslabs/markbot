export interface User2faTotpRow {
    user_id: string;
    secret_encrypted: string;
    created_at: Date | null;
    verified_at: Date | null;
    last_used_at: Date | null;
}
