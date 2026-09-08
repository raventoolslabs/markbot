export interface User2faRecoveryCodeRow {
    id: string; // UUID
    user_id: string | null;
    code_hash: string;
    created_at: Date | null;
    used_at: Date | null;
}
