import { GoogleLoginCommand } from './google-login.command';
import { UserRepository } from '@/app/ports/repositories/user.repository';
import { UserAssetRepository } from '@/app/ports/repositories/user-asset.repository';
import { User } from '@/domain/entities/User';
import { v4 as uuidv4 } from 'uuid';
import { downloadImageAsBase64 } from '@/infrastructure/utils/image.util';

export class GoogleLoginHandler {
    constructor(
        private userRepository: UserRepository,
        private userAssetRepository: UserAssetRepository
    ) { }

    async execute(command: GoogleLoginCommand): Promise<{ user: User, requires2fa: boolean }> {
        let user = await this.userRepository.findByEmail(command.email);

        if (!user) {
            const userId = uuidv4();

            const newUser: User = {
                id: userId,
                email: command.email,
                name: command.name || null,
                googleId: command.googleId,
                creationDate: new Date(),
                lastLogin: new Date(),
                passwordHash: null,
                emailVerified: true,
                failedLoginCount: 0,
                twoFactorEnabled: false,
                passwordSetAt: null,
                passwordChangedAt: null,
                lastFailedLoginAt: null,
                lockedUntil: null,
                twoFactorEnrolledAt: null,
                verifiedAt: null,
                twoFactorSecret: null
            };

            await this.userRepository.create(newUser);
            user = newUser;

            if (command.pictureUrl) {
                const image = await downloadImageAsBase64(command.pictureUrl);
                if (image) {
                    await this.userAssetRepository.create({
                        id: 0, // DB sequence handles this
                        userId: userId,
                        assetType: 'image',
                        assetName: 'profile_picture',
                        mimeType: image.mimeType,
                        content: image.content,
                        metadata: { source: 'google', originalUrl: command.pictureUrl },
                        creationDate: new Date(),
                    });
                }
            }
        } else {
            await this.userRepository.update(user.id, {
                lastLogin: new Date(),
                ...(user.googleId ? {} : { googleId: command.googleId, emailVerified: true })
            });

            // Update user instance locally for return
            user.lastLogin = new Date();
            if (!user.googleId) {
                user.googleId = command.googleId;
                user.emailVerified = true;
            }
        }

        return {
            user,
            requires2fa: user.twoFactorEnabled
        };
    }
}
