import { Router } from 'express';
import { listApiKeys, createApiKey, deleteApiKey } from '@/api/http/controllers/apiKey.controller';
import { authenticationMiddleware } from '@/api/http/middlewares/authentication.middleware';

const router = Router();

router.use(authenticationMiddleware);

router.get('/', listApiKeys);
router.post('/', createApiKey);
router.delete('/:id', deleteApiKey);

export const apiKeyRouter = router;
