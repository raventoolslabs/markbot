import { Request, Response } from 'express';
import { userAssetRepository } from '@/infrastructure/db/repositories/user-asset.repository';
import { logger } from '@/infrastructure/logging/logger';

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
