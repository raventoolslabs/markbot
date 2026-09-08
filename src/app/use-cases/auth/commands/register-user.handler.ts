import { RegisterUserCommand } from './register-user.command';
import { UserRepository } from '@/app/ports/repositories/user.repository';
import { VerificationCodeRepository } from '@/app/ports/repositories/verification-code.repository';
import { PasswordUtil } from '@/infrastructure/auth/password.util';
import { emailService } from '@/infrastructure/email/email.service';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/domain/entities/User';
import { UserAlreadyExistsException } from '@/domain/exceptions/AuthExceptions';

export class RegisterUserHandler {
    constructor(
        private userRepository: UserRepository,
        private verificationCodeRepository: VerificationCodeRepository
    ) { }

    async execute(command: RegisterUserCommand): Promise<{ user: Partial<User>, requiresEmailVerification: boolean }> {
        const existingUser = await this.userRepository.findByEmail(command.email);
        if (existingUser) {
            throw new UserAlreadyExistsException();
        }

        let passwordHash = null;
        if (command.password) {
            passwordHash = await PasswordUtil.hash(command.password);
        }

        const userId = uuidv4();

        const newUser: User = {
            id: userId,
            email: command.email,
            name: command.name || null,
            googleId: command.googleId || null,
            passwordHash: passwordHash,
            creationDate: new Date(),
            lastLogin: new Date(),
            emailVerified: !!command.isGoogleLogin,
            failedLoginCount: 0,
            twoFactorEnabled: false,
            passwordSetAt: command.password ? new Date() : null,
            passwordChangedAt: null,
            lastFailedLoginAt: null,
            lockedUntil: null,
            twoFactorEnrolledAt: null,
            twoFactorSecret: null,
            verifiedAt: null
        };

        await this.userRepository.create(newUser);

        if (!newUser.emailVerified) {
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            await this.verificationCodeRepository.create({
                userId: newUser.id,
                code: verificationCode,
                type: 'EMAIL_VERIFICATION',
                expiresAt: new Date(Date.now() + 15 * 60 * 1000)
            });

            await emailService.sendVerificationEmail(newUser.email, verificationCode);
        }

        return {
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                emailVerified: newUser.emailVerified,
                twoFactorEnabled: newUser.twoFactorEnabled,
            },
            requiresEmailVerification: !newUser.emailVerified
        };
    }
}
