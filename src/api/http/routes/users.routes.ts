import { Router } from 'express';
import { getUserImage, updateUser, deleteUser } from '@/api/http/controllers/users.controller';
import { authenticationMiddleware } from '@/api/http/middlewares/authentication.middleware';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get('/:userId/image', getUserImage);
router.put('/:userId', authenticationMiddleware, upload.single('image'), updateUser);
router.delete('/:userId', authenticationMiddleware, deleteUser);

export const usersRouter = router;
