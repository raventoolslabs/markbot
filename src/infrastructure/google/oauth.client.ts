import { OAuth2Client } from 'google-auth-library';
import { config } from '@/app/config';

export const createOAuthClient = (): OAuth2Client => {
    return new OAuth2Client(
        config.googleClientId,
        config.googleClientSecret,
        `${config.appHost}/api/google/oauth2/callback`,
    );
};
