import { OAuth2Client } from 'google-auth-library';
import { config } from '@/app/config';

// Solo se usa para verifyIdToken en el login: valida firma y audiencia del
// ID token, así que no necesita client secret ni redirect URI.
export const createOAuthClient = (): OAuth2Client => {
  return new OAuth2Client(config.googleClientId);
};
