import { VerifyEmailCommand } from './verify-email.command';
import { UserRepository } from '@/app/ports/repositories/user.repository';
import { VerificationCodeRepository } from '@/app/ports/repositories/verification-code.repository';
import { UserNotFoundException, InvalidTokenException } from '@/domain/exceptions/AuthExceptions';
import { User } from '@/domain/entities/User';

export class VerifyEmailHandler {
    constructor(
        private userRepository: UserRepository,
        private verificationCodeRepository: VerificationCodeRepository
    ) { }

    async execute(command: VerifyEmailCommand): Promise<{ user: User }> {
        const user = await this.userRepository.findByEmail(command.email);
        if (!user) {
            throw new UserNotFoundException();
        }

        const validCode = await this.verificationCodeRepository.findValidCode(user.id, command.code, 'EMAIL_VERIFICATION');
        if (!validCode) {
            throw new InvalidTokenException();
        }

        await this.userRepository.update(user.id, { emailVerified: true });
        await this.verificationCodeRepository.deleteCode(validCode.id);

        user.emailVerified = true;

        return { user };
    }
}
