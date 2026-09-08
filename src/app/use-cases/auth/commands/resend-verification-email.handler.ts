import { ResendVerificationEmailCommand } from './resend-verification-email.command';
import { UserRepository } from '@/app/ports/repositories/user.repository';
import { VerificationCodeRepository } from '@/app/ports/repositories/verification-code.repository';
import { emailService } from '@/infrastructure/email/email.service';
import { UserNotFoundException } from '@/domain/exceptions/AuthExceptions';

export class ResendVerificationEmailHandler {
    constructor(
        private userRepository: UserRepository,
        private verificationCodeRepository: VerificationCodeRepository
    ) { }

    async execute(command: ResendVerificationEmailCommand): Promise<void> {
        const user = await this.userRepository.findByEmail(command.email);
        if (!user) {
            throw new UserNotFoundException();
        }

        if (user.emailVerified) {
            throw new Error('Email already verified');
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        await this.verificationCodeRepository.create({
            userId: user.id,
            code: verificationCode,
            type: 'EMAIL_VERIFICATION',
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        await emailService.sendVerificationEmail(user.email, verificationCode);
    }
}
