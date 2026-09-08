import { DeleteUserCommand } from './delete-user.command';
import { UserRepository } from '@/app/ports/repositories/user.repository';
import { UserAssetRepository } from '@/app/ports/repositories/user-asset.repository';

export class DeleteUserHandler {
    constructor(
        private userRepository: UserRepository,
        private userAssetRepository: UserAssetRepository
    ) { }

    async execute(command: DeleteUserCommand): Promise<void> {
        const requestingUser = await this.userRepository.findByEmail(command.requestingUserEmail);

        if (!requestingUser || requestingUser.id !== command.targetUserId) {
            throw new Error('Unauthorized'); // Maps to 403
        }

        await this.userAssetRepository.deleteByUserId(command.targetUserId);
        await this.userRepository.delete(command.targetUserId);
    }
}
