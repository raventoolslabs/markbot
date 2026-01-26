import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config';
import { logger } from '../../util/logger';

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
    const webhookUrl = `${config.appHost}/api/google/message`;

    // Validate the token. Google Chat tokens can have either the Client ID,
    // the Project Number, or the Webhook URL as audience.
    await client.verifyIdToken({
      idToken: token,
      audience: [config.googleClientId as string, config.googleProjectNumber as string, webhookUrl],
    });

    // Optional: Add more checks if needed

    next();
  } catch (error) {
    logger.error('Token verification failed', 'AuthMiddleware', error);
    res.status(401).send('Unauthorized: Invalid token');
    return;
  }
};
