import { Request, Response } from 'express';
import { apiKeyRepository } from '@/infrastructure/db/repositories/ApiKeyRepository';
import { GetApiKeysHandler } from '@/app/use-cases/api-key/queries/get-api-keys.handler';
import { CreateApiKeyHandler } from '@/app/use-cases/api-key/commands/create-api-key.handler';
import { DeleteApiKeyHandler } from '@/app/use-cases/api-key/commands/delete-api-key.handler';

const getApiKeysHandler = new GetApiKeysHandler(apiKeyRepository);
const createApiKeyHandler = new CreateApiKeyHandler(apiKeyRepository);
const deleteApiKeyHandler = new DeleteApiKeyHandler(apiKeyRepository);

export const listApiKeys = async (req: Request, res: Response) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (req as any).user?.id || (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const keys = await getApiKeysHandler.execute({ userId });
        res.json(keys);
    } catch (error) {
        console.error('Error listing API keys:', error);
        res.status(500).json({ error: 'Failed to list API keys' });
    }
};

export const createApiKey = async (req: Request, res: Response) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (req as any).user?.id || (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { name, expirationDate, domain } = req.body;
        if (!name) {
            res.status(400).json({ error: 'Name is required' });
            return;
        }

        const result = await createApiKeyHandler.execute({
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (req as any).user?.id || (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const deleted = await deleteApiKeyHandler.execute({ id, userId });

        if (!deleted) {
            res.status(404).json({ error: 'API key not found' });
            return;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting API key:', error);
        res.status(500).json({ error: 'Failed to delete API key' });
    }
};
