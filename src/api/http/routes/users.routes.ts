import { Router } from 'express';
import { getUserImage } from '@/api/http/controllers/users.controller';

const router = Router();

router.get('/:userId/image', getUserImage);

export const usersRouter = router;
