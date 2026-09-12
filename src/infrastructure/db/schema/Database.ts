import { UserAssetRow } from './UserAssetRow';
import { UserRow } from './UserRow';
import { ApiKeyRow } from './ApiKeyRow';
import { User2faTotpRow } from './User2faTotpRow';
import { User2faRecoveryCodeRow } from './User2faRecoveryCodeRow';
import { UserVerificationCodeRow } from './UserVerificationCodeRow';

export interface Database {
  userasset: UserAssetRow;
  user: UserRow;
  api_key: ApiKeyRow;
  user_2fa_totp: User2faTotpRow;
  user_2fa_recovery_code: User2faRecoveryCodeRow;
  user_verification_code: UserVerificationCodeRow;
}
