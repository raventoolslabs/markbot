import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { config } from '@/app/config';
import { logger } from '@/infrastructure/logging/logger';
import { userRepository } from '@/infrastructure/db/repositories/user.repository';
import { user2faTotpRepository } from '@/infrastructure/db/repositories/user-2fa-totp.repository';
import { user2faRecoveryCodeRepository } from '@/infrastructure/db/repositories/user-2fa-recovery-code.repository';
import { v4 as uuidv4 } from 'uuid';
import { createOAuthClient } from '@/infrastructure/google/oauth.client';
import { downloadImageAsBase64 } from '@/infrastructure/utils/image.util';
import { userAssetRepository } from '@/infrastructure/db/repositories/user-asset.repository';
import { PasswordUtil } from '@/infrastructure/auth/password.util';
import { TotpUtil } from '@/infrastructure/auth/totp.util';
import { verificationCodeRepository } from '@/infrastructure/db/repositories/verification-code.repository';
import { emailService } from '@/infrastructure/email/email.service';

const client: OAuth2Client = createOAuthClient();

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
    return asset ? `${config.appHost}/api/users/${userId}/image` : null;
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            res.status(409).json({ message: 'User already exists' });
            return;
        }

        const passwordHash = await PasswordUtil.hash(password);
        const userId = uuidv4();

        const newUser = {
            id: userId,
            email,
            name: name || null,
            google_id: null,
            password_hash: passwordHash,
            creation_date: new Date(),
            last_login: new Date(),
            email_verified: false, // Or true if we don't implement email verification yet
            failed_login_count: 0,
            two_factor_enabled: false,
            password_set_at: new Date(),
            password_changed_at: null,
            last_failed_login_at: null,
            locked_until: null,
            two_factor_enrolled_at: null,
            two_factor_secret: null,
            verified_at: null
        };

        await userRepository.create(newUser);

        // Generate Verification Code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code

        await verificationCodeRepository.create({
            user_id: newUser.id,
            code: verificationCode,
            type: 'EMAIL_VERIFICATION',
            expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
        });

        // Send Email
        await emailService.sendVerificationEmail(newUser.email, verificationCode);

        // Do NOT return token yet, restrict login until verified? 
        // Or return token but UI handles verification check?
        // Let's return token to allow immediate "login" state but UI keeps them at verification screen if needed.
        // Actually, for better security, let's NOT return token, force verification.
        // But to keep it simple with existing frontend context which might expect auto-login:
        // We will return a specific flag 'requires_verification'.

        res.status(201).json({
            // token, // Optional: if we want to allow access before verification
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                picture: null,
                email_verified: newUser.email_verified,
            },
            requires_email_verification: true
        });

    } catch (error) {
        logger.error('Registration failed', 'AuthController', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        const user = await userRepository.findByEmail(email);

        // Account Lockout Check
        if (user && user.locked_until && user.locked_until > new Date()) {
            res.status(403).json({ message: 'Account is locked. Try again later.' });
            return;
        }

        if (!user || !user.password_hash) {
            // Fake verification to prevent timing attacks logic could go here
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const isValid = await PasswordUtil.verify(user.password_hash, password);

        if (!isValid) {
            // Handle failed attempt
            let failedCount = (user.failed_login_count || 0) + 1;
            let lockedUntil = null;

            if (failedCount >= 5) {
                lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
            }

            await userRepository.update(user.id, {
                failed_login_count: failedCount,
                last_failed_login_at: new Date(),
                locked_until: lockedUntil
            });

            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Reset failed count on success
        if (user.failed_login_count > 0) {
            await userRepository.update(user.id, {
                failed_login_count: 0,
                locked_until: null
            });
        }

        // UPDATE last_login
        await userRepository.update(user.id, { last_login: new Date() });


        // Check 2FA
        if (user.two_factor_enabled) {
            const tempToken = generateTempToken(user);
            res.status(200).json({
                requires_2fa: true,
                temp_token: tempToken
            });
            return;
        }

        const token = generateToken(user);
        const picture = await getProfilePictureUrl(user.id);

        res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                picture,
                email_verified: user.email_verified,
            },
        });

    } catch (error) {
        logger.error('Login failed', 'AuthController', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const verify2fa = async (req: Request, res: Response) => {
    try {
        const { temp_token, code } = req.body;

        let decoded: any;
        try {
            decoded = jwt.verify(temp_token, config.jwtSecret || 'default_secret_change_me');
        } catch (e) {
            res.status(401).json({ message: 'Invalid or expired session' });
            return;
        }

        if (decoded.type !== '2fa_pending') {
            res.status(401).json({ message: 'Invalid token type' });
            return;
        }

        const userId = decoded.userId;
        const user = await userRepository.findById(userId);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const totpRecord = await user2faTotpRepository.findByUserId(userId);
        if (!totpRecord) {
            res.status(400).json({ message: '2FA not configured' });
            return;
        }

        const secret = TotpUtil.decryptSecret(totpRecord.secret_encrypted);
        const isValid = TotpUtil.verify(code, secret);

        if (!isValid) {
            res.status(401).json({ message: 'Invalid code' });
            return;
        }

        const token = generateToken(user);
        const picture = await getProfilePictureUrl(user.id);

        res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                picture,
                email_verified: user.email_verified,
            },
        });
    } catch (error) {
        logger.error('2FA Verify failed', 'AuthController', error);
        res.status(500).json({ message: 'Internal server error' });
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

        if (!payload) {
            res.status(401).json({ message: 'Invalid token' });
            return;
        }

        const { sub: googleId, email, name, picture } = payload;

        if (!email) {
            res.status(400).json({ message: 'Email is required from Google' });
            return;
        }

        // Check if user exists
        let user = await userRepository.findByEmail(email);

        if (!user) {
            // Create new user
            const userId = uuidv4();

            const newUser = {
                id: userId,
                email,
                name: name || null,
                google_id: googleId,
                creation_date: new Date(),
                last_login: new Date(),
                password_hash: null,
                email_verified: true, // Google verified
                failed_login_count: 0,
                two_factor_enabled: false,
                password_set_at: null,
                password_changed_at: null,
                last_failed_login_at: null,
                locked_until: null,
                two_factor_enrolled_at: null,
                verified_at: null,
                two_factor_secret: null
            };

            await userRepository.create(newUser);

            user = newUser;

            if (picture) {
                const image = await downloadImageAsBase64(picture);
                if (image) {
                    await userAssetRepository.create({
                        user_id: userId,
                        asset_type: 'image',
                        asset_name: 'profile_picture',
                        mime_type: image.mimeType,
                        content: image.content,
                        metadata: { source: 'google', originalUrl: picture },
                    });
                }
            }
        } else {
            // Update last login
            await userRepository.update(user.id, {
                last_login: new Date(),
                // Update google_id if missing (linking)
                ...(user.google_id ? {} : { google_id: googleId, email_verified: true })
            });
        }

        // Check 2FA
        if (user.two_factor_enabled) {
            const tempToken = generateTempToken(user);
            res.status(200).json({
                requires_2fa: true,
                temp_token: tempToken
            });
            return;
        }

        // Generate JWT
        const jwtToken = generateToken(user);
        const userPicture = await getProfilePictureUrl(user.id);

        res.status(200).json({
            token: jwtToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: userPicture,
                email_verified: user.email_verified,
            },
        });
    } catch (error) {
        logger.error('Google login failed', 'AuthController', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const enable2faStart = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const user = await userRepository.findById(userId);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (user.two_factor_enabled) {
            res.status(400).json({ message: '2FA already enabled' });
            return;
        }

        const secret = TotpUtil.generateSecret();
        const encryptedSecret = TotpUtil.encryptSecret(secret);

        // Store secret temporarily or update existing pending record
        const existingTotp = await user2faTotpRepository.findByUserId(userId);
        if (existingTotp) {
            await user2faTotpRepository.update(userId, {
                secret_encrypted: encryptedSecret,
                verified_at: null // Reset verification
            });
        } else {
            await user2faTotpRepository.create({
                user_id: userId,
                secret_encrypted: encryptedSecret,
                created_at: new Date(),
                verified_at: null,
                last_used_at: null
            });
        }

        const qrCodeUrl = await TotpUtil.generateQRCode(secret, user.email);

        res.status(200).json({ secret, qrCodeUrl }); // Return secret for manual entry if needed
    } catch (error) {
        logger.error('Enable 2FA Start failed', 'AuthController', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const enable2faComplete = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { code } = req.body;

        const totpRecord = await user2faTotpRepository.findByUserId(userId);

        if (!totpRecord) {
            res.status(400).json({ message: '2FA initialization not started' });
            return;
        }

        const secret = TotpUtil.decryptSecret(totpRecord.secret_encrypted);
        const isValid = TotpUtil.verify(code, secret);

        if (!isValid) {
            res.status(401).json({ message: 'Invalid code' });
            return;
        }

        // 1. Mark TOTP as verified
        await user2faTotpRepository.update(userId, { verified_at: new Date() });

        // 2. Enable 2FA on User
        await userRepository.update(userId, {
            two_factor_enabled: true,
            two_factor_enrolled_at: new Date()
        });

        // 3. Generate Recovery Codes
        const codes = Array.from({ length: 10 }, () => uuidv4().replace(/-/g, '').substring(0, 10)); // 10 alphanumeric codes

        // Hash and store codes
        const codeRecords = await Promise.all(codes.map(async (code) => ({
            id: uuidv4(),
            user_id: userId,
            code_hash: await PasswordUtil.hash(code), // Using same hash algo (Argon2)
            created_at: new Date(),
            used_at: null
        })));

        // Clear old codes if any used to be there? (Maybe, but let's just add new ones or replace)
        // For simplicity, let's delete old ones first to avoid accumulation
        await user2faRecoveryCodeRepository.deleteByUserId(userId);
        await user2faRecoveryCodeRepository.createMany(codeRecords);

        res.status(200).json({ recovery_codes: codes });

    } catch (error) {
        logger.error('Enable 2FA Complete failed', 'AuthController', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const disable2fa = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { password, code } = req.body; // Require password OR valid OTP to disable

        const user = await userRepository.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Verify password if provided and user has password
        if (user.password_hash && password) {
            const isValidPass = await PasswordUtil.verify(user.password_hash, password);
            if (!isValidPass) {
                res.status(401).json({ message: 'Invalid password' });
                return;
            }
        } else if (code) {
            // Verify OTP
            const totpRecord = await user2faTotpRepository.findByUserId(userId);
            if (totpRecord) {
                const secret = TotpUtil.decryptSecret(totpRecord.secret_encrypted);
                if (!TotpUtil.verify(code, secret)) {
                    res.status(401).json({ message: 'Invalid 2FA code' });
                    return;
                }
            }
        } else {
            // If Google user (no pass), they must provide code? Or is session enough?
            // "Requiere reautenticación para acciones sensibles"
            // If logged in via Google recently, maybe okay? 
            // Let's enforce code or password.
            res.status(400).json({ message: 'Password or 2FA code required to disable 2FA' });
            return;
        }

        await userRepository.update(userId, {
            two_factor_enabled: false,
            two_factor_enrolled_at: null
        });

        await user2faTotpRepository.delete(userId);
        await user2faRecoveryCodeRepository.deleteByUserId(userId);

        res.status(200).json({ message: '2FA disabled successfully' });

    } catch (error) {
        logger.error('Disable 2FA failed', 'AuthController', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getRecoveryCodes = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        // Regenerate recovery codes
        const codes = Array.from({ length: 10 }, () => uuidv4().replace(/-/g, '').substring(0, 10));

        const codeRecords = await Promise.all(codes.map(async (code) => ({
            id: uuidv4(),
            user_id: userId,
            code_hash: await PasswordUtil.hash(code),
            created_at: new Date(),
            used_at: null
        })));

        await user2faRecoveryCodeRepository.deleteByUserId(userId);
        await user2faRecoveryCodeRepository.createMany(codeRecords);

        res.status(200).json({ recovery_codes: codes });
    } catch (error) {
        logger.error('Get Recovery Codes failed', 'AuthController', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body;

        const user = await userRepository.findByEmail(email);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const validCode = await verificationCodeRepository.findValidCode(user.id, code, 'EMAIL_VERIFICATION');
        if (!validCode) {
            res.status(400).json({ message: 'Invalid or expired verification code' });
            return;
        }

        // Mark verified
        await userRepository.update(user.id, { email_verified: true });

        // Delete code
        await verificationCodeRepository.deleteCode(validCode.id);

        // Generate token for auto-login
        const token = generateToken(user);
        const picture = await getProfilePictureUrl(user.id);

        res.status(200).json({
            message: 'Email verified successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                picture,
                email_verified: true,
            }
        });

    } catch (error) {
        logger.error('Verify Email failed', 'AuthController', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ message: 'Email is required' });
            return;
        }

        const user = await userRepository.findByEmail(email);
        if (!user) {
            // To prevent email enumeration, we might want to return 200 even if user not found.
            // But for now, let's be explicit since this is a protected/semi-protected action.
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (user.email_verified) {
            res.status(400).json({ message: 'Email already verified' });
            return;
        }

        // Generate Verification Code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code

        await verificationCodeRepository.create({
            user_id: user.id,
            code: verificationCode,
            type: 'EMAIL_VERIFICATION',
            expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
        });

        // Send Email
        await emailService.sendVerificationEmail(user.email, verificationCode);

        res.status(200).json({ message: 'Verification code sent' });

    } catch (error) {
        logger.error('Resend Verification Email failed', 'AuthController', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
