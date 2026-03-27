import { Enable2faStartCommand } from './enable-2fa-start.command';
import { User2faTotpRepository } from '@/app/ports/repositories/user-2fa-totp.repository';
import { UserRepository } from '@/app/ports/repositories/user.repository';
import { TotpUtil } from '@/infrastructure/auth/totp.util';
import { UserNotFoundException } from '@/domain/exceptions/AuthExceptions';

export class Enable2faStartHandler {
    constructor(
        private userRepository: UserRepository,
        private user2faTotpRepository: User2faTotpRepository
    ) { }

    async execute(command: Enable2faStartCommand): Promise<{ secret: string, qrCodeUrl: string }> {
        const user = await this.userRepository.findById(command.userId);

        if (!user) { throw new UserNotFoundException(); }
        if (user.twoFactorEnabled) { throw new Error('2FA already enabled'); }

        const secret = TotpUtil.generateSecret();
        const encryptedSecret = TotpUtil.encryptSecret(secret);

        const existingTotp = await this.user2faTotpRepository.findByUserId(command.userId);
        if (existingTotp) {
            await this.user2faTotpRepository.update(command.userId, {
                secretEncrypted: encryptedSecret,
                verifiedAt: null
            });
        } else {
            await this.user2faTotpRepository.create({
                userId: command.userId,
                secretEncrypted: encryptedSecret,
                createdAt: new Date(),
                verifiedAt: null,
                lastUsedAt: null
            });
        }

        const qrCodeUrl = await TotpUtil.generateQRCode(secret, user.email);

        return { secret, qrCodeUrl };
    }
}
