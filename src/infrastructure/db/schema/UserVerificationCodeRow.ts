import { Generated } from 'kysely';

export interface UserVerificationCodeRow {
    id: Generated<string>;
    user_id: string;
    code: string;
    type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
    expires_at: Date;
    created_at: Generated<Date>;
}
