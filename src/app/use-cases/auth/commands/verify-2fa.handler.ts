import { Verify2faCommand } from './verify-2fa.command';
import { User2faTotpRepository } from '@/app/ports/repositories/user-2fa-totp.repository';
import { TotpUtil } from '@/infrastructure/auth/totp.util';
import { InvalidTokenException } from '@/domain/exceptions/AuthExceptions';

export class Verify2faHandler {
    constructor(private user2faTotpRepository: User2faTotpRepository) { }

    async execute(command: Verify2faCommand): Promise<void> {
        const totpRecord = await this.user2faTotpRepository.findByUserId(command.userId);

        if (!totpRecord) {
            throw new Error('2FA not configured');
        }

        const secret = TotpUtil.decryptSecret(totpRecord.secretEncrypted);
        const isValid = TotpUtil.verify(command.code, secret);

        if (!isValid) {
            throw new InvalidTokenException();
        }
    }
}
