import { Request, Response } from 'express';
import { ApiKeyRepository } from '../../../infrastructure/db/repositories/ApiKeyRepository';
import { managerDb } from '../../../infrastructure/db/client';

const apiKeyRepository = new ApiKeyRepository(managerDb.db);

export const listApiKeys = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const keys = await apiKeyRepository.findByUserId(userId);
        res.json(keys);
    } catch (error) {
        console.error('Error listing API keys:', error);
        res.status(500).json({ error: 'Failed to list API keys' });
    }
};

export const createApiKey = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name, expirationDate, domain } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const result = await apiKeyRepository.create({
            userId,
            name,
            expirationDate: expirationDate ? new Date(expirationDate) : undefined,
            domain,
        });

        res.json(result);
    } catch (error) {
        console.error('Error creating API key:', error);
        res.status(500).json({ error: 'Failed to create API key' });
    }
};

export const deleteApiKey = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;
        const deleted = await apiKeyRepository.delete(id, userId);

        if (!deleted) {
            return res.status(404).json({ error: 'API key not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting API key:', error);
        res.status(500).json({ error: 'Failed to delete API key' });
    }
};
