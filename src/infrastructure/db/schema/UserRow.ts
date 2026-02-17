export interface UserRow {
    id: string;
    email: string;
    name: string | null;
    google_id: string | null;
    creation_date: Date;
    last_login: Date | null;
}
