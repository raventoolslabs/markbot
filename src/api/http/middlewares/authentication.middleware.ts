import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/app/config';

export const authenticationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Unauthorized: Invalid token format' });
        return;
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret || 'default_secret_change_me') as any;
        (req as any).user = {
            id: decoded.userId,
            userId: decoded.userId,
            email: decoded.email
        };
        next();
    } catch (error) {
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
