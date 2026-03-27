import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { config } from '@/app/config';
import { logger } from '@/infrastructure/logging/logger';
import { createOAuthClient } from '@/infrastructure/google/oauth.client';

// Repositories
import { userRepository } from '@/infrastructure/db/repositories/user.repository';
import { user2faTotpRepository } from '@/infrastructure/db/repositories/user-2fa-totp.repository';
import { user2faRecoveryCodeRepository } from '@/infrastructure/db/repositories/user-2fa-recovery-code.repository';
import { userAssetRepository } from '@/infrastructure/db/repositories/user-asset.repository';
import { verificationCodeRepository } from '@/infrastructure/db/repositories/verification-code.repository';

// Use Cases
import { RegisterUserHandler } from '@/app/use-cases/auth/commands/register-user.handler';
import { LoginUserHandler } from '@/app/use-cases/auth/commands/login-user.handler';
import { Verify2faHandler } from '@/app/use-cases/auth/commands/verify-2fa.handler';
import { GoogleLoginHandler } from '@/app/use-cases/auth/commands/google-login.handler';
import { Enable2faStartHandler } from '@/app/use-cases/auth/commands/enable-2fa-start.handler';
import { Enable2faCompleteHandler } from '@/app/use-cases/auth/commands/enable-2fa-complete.handler';
import { Disable2faHandler } from '@/app/use-cases/auth/commands/disable-2fa.handler';
import { GenerateRecoveryCodesHandler } from '@/app/use-cases/auth/commands/generate-recovery-codes.handler';
import { VerifyEmailHandler } from '@/app/use-cases/auth/commands/verify-email.handler';
import { ResendVerificationEmailHandler } from '@/app/use-cases/auth/commands/resend-verification-email.handler';

// Exceptions
import {
    InvalidCredentialsException,
    AccountLockedException,
    UserAlreadyExistsException,
    UserNotFoundException,
    InvalidTokenException
} from '@/domain/exceptions/AuthExceptions';

const client: OAuth2Client = createOAuthClient();

const registerUserHandler = new RegisterUserHandler(userRepository, verificationCodeRepository);
const loginUserHandler = new LoginUserHandler(userRepository);
const verify2faHandler = new Verify2faHandler(user2faTotpRepository);
const googleLoginHandler = new GoogleLoginHandler(userRepository, userAssetRepository);
const enable2faStartHandler = new Enable2faStartHandler(userRepository, user2faTotpRepository);
const enable2faCompleteHandler = new Enable2faCompleteHandler(userRepository, user2faTotpRepository, user2faRecoveryCodeRepository);
const disable2faHandler = new Disable2faHandler(userRepository, user2faTotpRepository, user2faRecoveryCodeRepository);
const generateRecoveryCodesHandler = new GenerateRecoveryCodesHandler(user2faRecoveryCodeRepository);
const verifyEmailHandler = new VerifyEmailHandler(userRepository, verificationCodeRepository);
const resendVerificationEmailHandler = new ResendVerificationEmailHandler(userRepository, verificationCodeRepository);

const generateToken = (user: { id: string, email: string }) => {
    return jwt.sign(
        { userId: user.id, email: user.email },
        config.jwtSecret || 'default_secret_change_me',
        { expiresIn: '7d' }
    );
};

const generateTempToken = (user: { id: string, email: string }) => {
    return jwt.sign(
        { userId: user.id, email: user.email, type: '2fa_pending' },
        config.jwtSecret || 'default_secret_change_me',
        { expiresIn: '5m' }
    );
};

const getProfilePictureUrl = async (userId: string): Promise<string | null> => {
    const asset = await userAssetRepository.findByUserId(userId);
    return asset ? `/api/users/${userId}/image` : null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleErrorResponse = (error: any, res: Response, defaultMessage: string = 'Internal server error') => {
    if (error instanceof UserAlreadyExistsException) return res.status(409).json({ message: error.message });
    if (error instanceof InvalidCredentialsException) return res.status(401).json({ message: error.message });
    if (error instanceof AccountLockedException) return res.status(403).json({ message: error.message });
    if (error instanceof UserNotFoundException) return res.status(404).json({ message: error.message });
    if (error instanceof InvalidTokenException) return res.status(401).json({ message: error.message });

    if (error.status) return res.status(error.status).json({ message: error.message });
    if (error.message === '2FA not configured' || error.message === '2FA already enabled' || error.message === 'Email already verified' || error.message === 'Password or 2FA code required to disable 2FA' || error.message === '2FA initialization not started') {
        return res.status(400).json({ message: error.message });
    }

    logger.error(defaultMessage, 'AuthController', error);
    return res.status(500).json({ message: defaultMessage });
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        const result = await registerUserHandler.execute({ email, password, name });
        // NOTE: The previous code returned requiring email verification
        res.status(201).json({
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                picture: null,
                email_verified: result.user.emailVerified,
                two_factor_enabled: result.user.twoFactorEnabled,
            },
            requires_email_verification: result.requiresEmailVerification
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        handleErrorResponse(error, res, 'Registration failed');
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        const result = await loginUserHandler.execute({ email, password });

        if (result.requires2fa) {
            const tempToken = generateTempToken(result.user);
            res.status(200).json({
                requires_2fa: true,
                temp_token: tempToken
            });
            return;
        }

        const token = generateToken(result.user);
        const picture = await getProfilePictureUrl(result.user.id);

        res.status(200).json({
            token,
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                picture,
                email_verified: result.user.emailVerified,
                two_factor_enabled: result.user.twoFactorEnabled,
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        handleErrorResponse(error, res, 'Login failed');
    }
};

export const verify2fa = async (req: Request, res: Response) => {
    try {
        const { temp_token, code } = req.body;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let decoded: any;
        try {
            decoded = jwt.verify(temp_token, config.jwtSecret || 'default_secret_change_me');
        } catch {
            res.status(401).json({ message: 'Invalid or expired session' });
            return;
        }

        if (decoded.type !== '2fa_pending') {
            res.status(401).json({ message: 'Invalid token type' });
            return;
        }

        const userId = decoded.userId;
        await verify2faHandler.execute({ userId, code });

        // Generate full token after success. 
        const user = await userRepository.findById(userId);
        if (!user) throw new UserNotFoundException();

        const token = generateToken(user);
        const picture = await getProfilePictureUrl(user.id);

        res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                picture,
                email_verified: user.emailVerified,
                two_factor_enabled: user.twoFactorEnabled,
            },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        handleErrorResponse(error, res, '2FA Verify failed');
    }
};

export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;

        if (!token) {
            res.status(400).json({ message: 'Token is required' });
            return;
        }

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: config.googleClientId,
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email || !payload.sub) {
            res.status(401).json({ message: 'Invalid token or email required' });
            return;
        }

        const result = await googleLoginHandler.execute({
            googleId: payload.sub,
            email: payload.email,
            name: payload.name,
            pictureUrl: payload.picture,
        });

        if (result.requires2fa) {
            const tempToken = generateTempToken(result.user);
            res.status(200).json({
                requires_2fa: true,
                temp_token: tempToken
            });
            return;
        }

        const jwtToken = generateToken(result.user);
        const userPicture = await getProfilePictureUrl(result.user.id);

        res.status(200).json({
            token: jwtToken,
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                picture: userPicture,
                email_verified: result.user.emailVerified,
                two_factor_enabled: result.user.twoFactorEnabled,
            },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        handleErrorResponse(error, res, 'Google login failed');
    }
};

export const enable2faStart = async (req: Request, res: Response) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (req as any).user.userId;
        const result = await enable2faStartHandler.execute({ userId });
        res.status(200).json(result);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        handleErrorResponse(error, res, 'Enable 2FA Start failed');
    }
};

export const enable2faComplete = async (req: Request, res: Response) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (req as any).user.userId;
        const { code } = req.body;

        const result = await enable2faCompleteHandler.execute({ userId, code });
        res.status(200).json({ recovery_codes: result.recoveryCodes });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        handleErrorResponse(error, res, 'Enable 2FA Complete failed');
    }
};

export const disable2fa = async (req: Request, res: Response) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (req as any).user.userId;
        const { password, code } = req.body;

        await disable2faHandler.execute({ userId, password, code });
        res.status(200).json({ message: '2FA disabled successfully' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        handleErrorResponse(error, res, 'Disable 2FA failed');
    }
};

export const getRecoveryCodes = async (req: Request, res: Response) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (req as any).user.userId;
        const codes = await generateRecoveryCodesHandler.execute({ userId });
        res.status(200).json({ recovery_codes: codes });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        handleErrorResponse(error, res, 'Get Recovery Codes failed');
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body;

        const result = await verifyEmailHandler.execute({ email, code });

        const token = generateToken(result.user);
        const picture = await getProfilePictureUrl(result.user.id);

        res.status(200).json({
            message: 'Email verified successfully',
            token,
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                picture,
                email_verified: true,
                two_factor_enabled: result.user.twoFactorEnabled,
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        handleErrorResponse(error, res, 'Verify Email failed');
    }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ message: 'Email is required' });
            return;
        }

        await resendVerificationEmailHandler.execute({ email });
        res.status(200).json({ message: 'Verification code sent' });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        handleErrorResponse(error, res, 'Resend Verification Email failed');
    }
};
