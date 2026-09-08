export interface UserRow {
    id: string;
    email: string;
    name: string | null;
    google_id: string | null;
    creation_date: Date;
    last_login: Date | null;
    password_hash: string | null;
    password_set_at: Date | null;
    password_changed_at: Date | null;
    failed_login_count: number;
    last_failed_login_at: Date | null;
    locked_until: Date | null;
    two_factor_enabled: boolean;
    two_factor_enrolled_at: Date | null;
    two_factor_secret: string | null;
    verified_at: Date | null;
    email_verified?: boolean;
}
