import { GenerateRecoveryCodesCommand } from './generate-recovery-codes.command';
import { User2faRecoveryCodeRepository } from '@/app/ports/repositories/user-2fa-recovery-code.repository';
import { PasswordUtil } from '@/infrastructure/auth/password.util';
import { v4 as uuidv4 } from 'uuid';

export class GenerateRecoveryCodesHandler {
    constructor(private user2faRecoveryCodeRepository: User2faRecoveryCodeRepository) { }

    async execute(command: GenerateRecoveryCodesCommand): Promise<string[]> {
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

        return codes;
    }
}
