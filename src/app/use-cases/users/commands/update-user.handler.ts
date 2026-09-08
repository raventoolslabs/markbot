import { UpdateUserCommand } from './update-user.command';
import { UserRepository } from '@/app/ports/repositories/user.repository';
import { UserAssetRepository } from '@/app/ports/repositories/user-asset.repository';
import { User } from '@/domain/entities/User';
import { UserNotFoundException } from '@/domain/exceptions/AuthExceptions';

export class UpdateUserHandler {
    constructor(
        private userRepository: UserRepository,
        private userAssetRepository: UserAssetRepository
    ) { }

    async execute(command: UpdateUserCommand): Promise<{ user: User }> {
        const requestingUser = await this.userRepository.findByEmail(command.requestingUserEmail);

        if (!requestingUser || requestingUser.id !== command.targetUserId) {
            throw new Error('Unauthorized'); // Maps to 403
        }

        if (command.name) {
            await this.userRepository.update(command.targetUserId, { name: command.name });
            requestingUser.name = command.name;
        }

        if (command.file) {
            const content = command.file.buffer.toString('base64');
            const mimeType = command.file.mimetype;

            const existingAsset = await this.userAssetRepository.findByUserId(command.targetUserId);

            if (existingAsset) {
                await this.userAssetRepository.update(command.targetUserId, {
                    content,
                    mimeType,
                    assetName: 'profile_picture',
                    metadata: { ...(existingAsset.metadata || {}), source: 'upload', updated: new Date() }
                });
            } else {
                await this.userAssetRepository.create({
                    id: 0,
                    userId: command.targetUserId,
                    assetType: 'image',
                    assetName: 'profile_picture',
                    mimeType,
                    content,
                    metadata: { source: 'upload' },
                    creationDate: new Date()
                });
            }
        }

        return { user: requestingUser };
    }
}
