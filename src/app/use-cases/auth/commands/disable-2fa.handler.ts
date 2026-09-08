import { Disable2faCommand } from './disable-2fa.command';
import { User2faTotpRepository } from '@/app/ports/repositories/user-2fa-totp.repository';
import { UserRepository } from '@/app/ports/repositories/user.repository';
import { User2faRecoveryCodeRepository } from '@/app/ports/repositories/user-2fa-recovery-code.repository';
import { TotpUtil } from '@/infrastructure/auth/totp.util';
import { PasswordUtil } from '@/infrastructure/auth/password.util';
import { InvalidTokenException, InvalidCredentialsException, UserNotFoundException } from '@/domain/exceptions/AuthExceptions';

export class Disable2faHandler {
    constructor(
        private userRepository: UserRepository,
        private user2faTotpRepository: User2faTotpRepository,
        private user2faRecoveryCodeRepository: User2faRecoveryCodeRepository
    ) { }

    async execute(command: Disable2faCommand): Promise<void> {
        const user = await this.userRepository.findById(command.userId);
        if (!user) { throw new UserNotFoundException(); }

        if (user.passwordHash && command.password) {
            const isValidPass = await PasswordUtil.verify(user.passwordHash, command.password);
            if (!isValidPass) { throw new InvalidCredentialsException(); }
        } else if (command.code) {
            const totpRecord = await this.user2faTotpRepository.findByUserId(command.userId);
            if (totpRecord) {
                const secret = TotpUtil.decryptSecret(totpRecord.secretEncrypted);
                if (!TotpUtil.verify(command.code, secret)) {
                    throw new InvalidTokenException();
                }
            } else {
                throw new Error('2FA not configured');
            }
        } else {
            throw new Error('Password or 2FA code required to disable 2FA');
        }

        await this.userRepository.update(command.userId, {
            twoFactorEnabled: false,
            twoFactorEnrolledAt: null
        });

        await this.user2faTotpRepository.delete(command.userId);
        await this.user2faRecoveryCodeRepository.deleteByUserId(command.userId);
    }
}
