import { Request, Response } from 'express';
import { ApiKeyRepository } from '../../../infrastructure/db/repositories/ApiKeyRepository';
import { managerDb } from '../../../infrastructure/db/client';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '@/app/config';

const apiKeyRepository = new ApiKeyRepository(managerDb.db);

export const getWidgetToken = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: Missing API Key' });
        }

        const apiKey = authHeader.split(' ')[1];
        // Hash the incoming key to compare with stored hash
        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

        const keyRecord = await apiKeyRepository.findByKeyHash(keyHash);

        if (!keyRecord) {
            return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
        }

        // Check expiration
        if (keyRecord.expirationDate && new Date() > keyRecord.expirationDate) {
            return res.status(401).json({ error: 'Unauthorized: API Key expired' });
        }

        // Check domain (if provided in body and restricted in key)
        const { widgetId, allowedOrigin } = req.body;

        if (keyRecord.domain && allowedOrigin) {
            // Simple domain check (can be improved to handle subdomains/protocols)
            if (!allowedOrigin.includes(keyRecord.domain)) {
                return res.status(403).json({ error: 'Forbidden: Domain not allowed' });
            }
        }

        // Generate Short-lived Token
        const token = jwt.sign(
            {
                widgetId,
                allowedOrigin,
                userId: keyRecord.userId,
                type: 'widget_token'
            },
            config.jwtSecret || 'default_secret_change_me',
            { expiresIn: '300s' } // 5 minutes
        );

        res.json({ token, expiresIn: 300 });

    } catch (error) {
        console.error('Error generating widget token:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const validateWidgetToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ valid: false, error: 'Token required' });
        }

        try {
            const decoded = jwt.verify(token, config.jwtSecret || 'default_secret_change_me') as any;
            if (decoded.type !== 'widget_token') {
                return res.status(401).json({ valid: false, error: 'Invalid token type' });
            }
            res.json({ valid: true, decoded });
        } catch (err) {
            return res.status(401).json({ valid: false, error: 'Invalid or expired token' });
        }
    } catch (error) {
        console.error('Error validating token:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
