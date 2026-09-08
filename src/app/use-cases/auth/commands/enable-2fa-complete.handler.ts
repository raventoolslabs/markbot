import { Enable2faCompleteCommand } from './enable-2fa-complete.command';
import { User2faTotpRepository } from '@/app/ports/repositories/user-2fa-totp.repository';
import { UserRepository } from '@/app/ports/repositories/user.repository';
import { User2faRecoveryCodeRepository } from '@/app/ports/repositories/user-2fa-recovery-code.repository';
import { TotpUtil } from '@/infrastructure/auth/totp.util';
import { PasswordUtil } from '@/infrastructure/auth/password.util';
import { InvalidTokenException } from '@/domain/exceptions/AuthExceptions';
import { v4 as uuidv4 } from 'uuid';

export class Enable2faCompleteHandler {
    constructor(
        private userRepository: UserRepository,
        private user2faTotpRepository: User2faTotpRepository,
        private user2faRecoveryCodeRepository: User2faRecoveryCodeRepository
    ) { }

    async execute(command: Enable2faCompleteCommand): Promise<{ recoveryCodes: string[] }> {
        const totpRecord = await this.user2faTotpRepository.findByUserId(command.userId);

        if (!totpRecord) {
            throw new Error('2FA initialization not started');
        }

        const secret = TotpUtil.decryptSecret(totpRecord.secretEncrypted);
        const isValid = TotpUtil.verify(command.code, secret);

        if (!isValid) {
            throw new InvalidTokenException();
        }

        await this.user2faTotpRepository.update(command.userId, { verifiedAt: new Date() });

        await this.userRepository.update(command.userId, {
            twoFactorEnabled: true,
            twoFactorEnrolledAt: new Date()
        });

        const codes = Array.from({ length: 10 }, () => uuidv4().replace(/-/g, '').substring(0, 10));

        const codeRecords = await Promise.all(codes.map(async (code) => ({
            id: uuidv4(),
            userId: command.userId,
            codeHash: await PasswordUtil.hash(code),
            createdAt: new Date(),
            usedAt: null
        })));

        await this.user2faRecoveryCodeRepository.deleteByUserId(command.userId);
        await this.user2faRecoveryCodeRepository.createMany(codeRecords);

        return { recoveryCodes: codes };
    }
}
