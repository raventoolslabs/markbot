import { Request, Response } from 'express';
import { userAssetRepository } from '@/infrastructure/db/repositories/user-asset.repository';
import { userRepository } from '@/infrastructure/db/repositories/user.repository';
import { logger } from '@/infrastructure/logging/logger';
import { config } from '@/app/config';

export const getUserImage = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const asset = await userAssetRepository.findByUserId(userId);

        if (!asset) {
            res.status(404).json({ message: 'User image not found' });
            return;
        }

        const buffer = Buffer.from(asset.content, 'base64');

        res.set('Content-Type', asset.mime_type || 'image/jpeg');
        res.set('Content-Length', buffer.length.toString());
        res.send(buffer);
    } catch (error) {
        logger.error('Failed to get user image', 'UsersController', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { name } = req.body;
        const file = req.file;

        const user = await userRepository.findByEmail((req as any).user.email); // Assuming auth middleware populates user

        if (!user || user.id !== userId) {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }

        if (name) {
            await userRepository.update(userId, { name });
        }

        if (file) {
            const content = file.buffer.toString('base64');
            const mimeType = file.mimetype;

            // Check if asset exists to update or create
            const existingAsset = await userAssetRepository.findByUserId(userId);

            if (existingAsset) {
                await userAssetRepository.update(userId, {
                    content,
                    mime_type: mimeType,
                    asset_name: 'profile_picture', // Ensure name is consistent
                    metadata: { ...existingAsset.metadata, source: 'upload', updated: new Date() }
                });
            } else {
                await userAssetRepository.create({
                    user_id: userId,
                    asset_type: 'image',
                    asset_name: 'profile_picture',
                    mime_type: mimeType,
                    content,
                    metadata: { source: 'upload' }
                });
            }
        }

        const updatedUser = await userRepository.findByEmail(user.email);

        res.json({
            user: {
                id: updatedUser!.id,
                email: updatedUser!.email,
                name: updatedUser!.name,
                picture: `/api/users/${updatedUser!.id}/image`, // Always return the endpoint
                two_factor_enabled: updatedUser!.two_factor_enabled,
            }
        });

    } catch (error) {
        logger.error('Failed to update user', 'UsersController', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const user = await userRepository.findByEmail((req as any).user.email);

        if (!user || user.id !== userId) {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }

        // Delete user assets first (although foreign key cascade should handle it ideally, explicit is safer if not configured)
        // Check schema first. Assuming cascade might not be set for everything or we want to be sure.
        // Actually, let's rely on DB cascade if possible, but we don't know if it's set.
        // Let's safe delete assets.
        await userAssetRepository.deleteByUserId(userId);

        // Delete user
        await userRepository.delete(userId);

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error('Failed to delete user', 'UsersController', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
