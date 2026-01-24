import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config';

const client = new OAuth2Client();

export const verifyGoogleChatToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).send('Unauthorized: No token provided');
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).send('Unauthorized: Invalid token format');
        return;
    }

    try {
        // Validate the token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: config.googleClientId,
        });

        const payload = ticket.getPayload();
        // Optional: Add more checks if needed

        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).send('Unauthorized: Invalid token');
        return;
    }
};
