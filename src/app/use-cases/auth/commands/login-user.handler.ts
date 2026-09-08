import { LoginUserCommand } from './login-user.command';
import { UserRepository } from '@/app/ports/repositories/user.repository';
import { PasswordUtil } from '@/infrastructure/auth/password.util';
import { User } from '@/domain/entities/User';
import { AccountLockedException, InvalidCredentialsException } from '@/domain/exceptions/AuthExceptions';

export class LoginUserHandler {
    constructor(private userRepository: UserRepository) { }

    async execute(command: LoginUserCommand): Promise<{ user: User, requires2fa: boolean }> {
        const user = await this.userRepository.findByEmail(command.email);

        if (user && user.lockedUntil && user.lockedUntil > new Date()) {
            throw new AccountLockedException();
        }

        if (!user || (!user.passwordHash && command.password)) {
            throw new InvalidCredentialsException();
        }

        if (command.password && user.passwordHash) {
            const isValid = await PasswordUtil.verify(user.passwordHash, command.password);

            if (!isValid) {
                let failedCount = (user.failedLoginCount || 0) + 1;
                let lockedUntil = null;

                if (failedCount >= 5) {
                    lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
                }

                await this.userRepository.update(user.id, {
                    failedLoginCount: failedCount,
                    lastFailedLoginAt: new Date(),
                    lockedUntil: lockedUntil
                });

                throw new InvalidCredentialsException();
            }
        }

        // Reset failed count on success
        if (user.failedLoginCount > 0) {
            await this.userRepository.update(user.id, {
                failedLoginCount: 0,
                lockedUntil: null
            });
        }

        await this.userRepository.update(user.id, { lastLogin: new Date() });

        return {
            user,
            requires2fa: user.twoFactorEnabled
        };
    }
}
