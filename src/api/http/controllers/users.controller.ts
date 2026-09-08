import { Request, Response } from 'express';
import { logger } from '@/infrastructure/logging/logger';

import { userRepository } from '@/infrastructure/db/repositories/user.repository';
import { userAssetRepository } from '@/infrastructure/db/repositories/user-asset.repository';

import { GetUserImageHandler } from '@/app/use-cases/users/queries/get-user-image.handler';
import { UpdateUserHandler } from '@/app/use-cases/users/commands/update-user.handler';
import { DeleteUserHandler } from '@/app/use-cases/users/commands/delete-user.handler';

const getUserImageHandler = new GetUserImageHandler(userAssetRepository);
const updateUserHandler = new UpdateUserHandler(userRepository, userAssetRepository);
const deleteUserHandler = new DeleteUserHandler(userRepository, userAssetRepository);

export const getUserImage = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const result = await getUserImageHandler.execute({ userId });

        if (!result) {
            res.status(404).json({ message: 'User image not found' });
            return;
        }

        const buffer = Buffer.from(result.content, 'base64');
        res.set('Content-Type', result.mimeType);
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const requestingUserEmail = (req as any).user.email;

        const result = await updateUserHandler.execute({
            targetUserId: userId,
            requestingUserEmail,
            name,
            file: file ? { buffer: file.buffer, mimetype: file.mimetype } : undefined
        });

        res.json({
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                picture: `/api/users/${result.user.id}/image`,
                two_factor_enabled: result.user.twoFactorEnabled,
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }
        logger.error('Failed to update user', 'UsersController', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const requestingUserEmail = (req as any).user.email;

        await deleteUserHandler.execute({ targetUserId: userId, requestingUserEmail });

        res.status(200).json({ message: 'User deleted successfully' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }
        logger.error('Failed to delete user', 'UsersController', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
