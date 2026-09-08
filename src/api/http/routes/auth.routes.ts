import { Router } from 'express';
import { googleLogin, login, register, verify2fa, verifyEmail, enable2faStart, enable2faComplete, disable2fa, getRecoveryCodes, resendVerificationEmail } from '../controllers/auth.controller';
import { authenticationMiddleware } from '../middlewares/authentication.middleware';

const router = Router();

router.post('/google', googleLogin);
router.post('/login', login);
router.post('/register', register);
router.post('/2fa/verify', verify2fa);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Protected routes
router.post('/2fa/enable/start', authenticationMiddleware, enable2faStart);
router.post('/2fa/enable/complete', authenticationMiddleware, enable2faComplete);
router.post('/2fa/disable', authenticationMiddleware, disable2fa);
router.get('/2fa/recovery-codes', authenticationMiddleware, getRecoveryCodes);

export const authRouter = router;
