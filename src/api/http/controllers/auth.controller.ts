import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { config } from '@/app/config';
import { logger } from '@/infrastructure/logging/logger';
import { userRepository } from '@/infrastructure/db/repositories/user.repository';
import { v4 as uuidv4 } from 'uuid';
import { createOAuthClient } from '@/infrastructure/google/oauth.client';
import { downloadImageAsBase64 } from '@/infrastructure/utils/image.util';
import { userAssetRepository } from '@/infrastructure/db/repositories/user-asset.repository';

const client: OAuth2Client = createOAuthClient();

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
            let pictureUrl = picture || null;

            const newUser = {
                id: userId,
                email,
                name: name || null,
                google_id: googleId,
                creation_date: new Date(),
                last_login: new Date(),
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
                // Do not update name to allow user modifications
            });
        }

        // Generate JWT
        const jwtToken = jwt.sign(
            { userId: user.id, email: user.email },
            config.jwtSecret || 'default_secret_change_me',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            token: jwtToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: `${config.appHost}/api/users/${user.id}/image`,
            },
        });
    } catch (error) {
        logger.error('Google login failed', 'AuthController', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
