import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config';

import { tokenQueueManager } from '../queue/tokenQueue';

export class ChatService {
    private client: OAuth2Client;

    constructor() {
        this.client = new OAuth2Client(
            config.googleClientId,
            config.googleClientSecret,
            `${config.appHost}/api/google/oauth2/callback`
        );

        this.client.on('tokens', (tokens) => {
            console.log('Tokens refreshed via event');
            this.saveTokens(tokens);
        });

        if (config.googleClientToken) {
            try {
                const tokens = JSON.parse(config.googleClientToken);
                this.client.setCredentials(tokens);
                console.log('Google Chat credentials loaded from config');
            } catch (error) {
                console.error('Error parsing Google Chat token from config:', error);
            }
        }

        // Register with Generic Queue Manager
        tokenQueueManager.registerHandler('google', async () => {
            console.log('[ChatService] Queue requested token refresh/check');
            await this.checkAndRefreshTokens();

            // Return next expiry date
            const credentials = this.client.credentials;
            if (credentials && credentials.expiry_date) {
                return credentials.expiry_date;
            } else {
                // If no expiry, maybe check again in 1 hour? Or throw?
                // If we have a token but no expiry, it's valid indefinitely or we don't know?
                // Let's assume 1 hour to re-check if it gets one.
                return Date.now() + 3600 * 1000;
            }
        });
    }

    private saveTokens(tokens: any) {
        // Update in-memory config
        // Merge with existing credentials/tokens to keep fields like refresh_token if new one doesn't have it
        const tokenString = JSON.stringify(tokens);
        config.googleClientToken = tokenString;
        console.log('Tokens updated in memory');
    }

    getAuthUrl(): string {
        const scopes = config.googleClientScope;
        console.log('scopes', scopes);
        return this.client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
        });
    }

    async getToken(code: string) {
        const { tokens } = await this.client.getToken(code);
        this.client.setCredentials(tokens);
        this.saveTokens(tokens);
        return tokens;
    }

    private clearTokens() {
        console.log('Clearing invalid/expired tokens...');
        this.client.setCredentials({});
        config.googleClientToken = undefined;

        try {
            const envPath = path.resolve(process.cwd(), '.env');
            if (fs.existsSync(envPath)) {
                let envContent = fs.readFileSync(envPath, 'utf8');
                const newEnvContent = envContent.replace(/^GOOGLE_CLIENT_TOKEN=.*$[\n\r]*/gm, '');

                if (envContent !== newEnvContent) {
                    fs.writeFileSync(envPath, newEnvContent);
                    console.log('Removed GOOGLE_CLIENT_TOKEN from .env');
                }
            }
        } catch (error) {
            console.error('Error removing token from .env:', error);
        }
    }

    async checkAndRefreshTokens() {
        if (!config.googleClientToken) {
            console.log('No Google Client Token found to refresh.');
            throw new Error('No token configured'); // Throw so Queue knows it failed
        }

        try {
            console.log('Checking Google Client Token...');
            await this.client.getAccessToken(); // Refresh if needed
            console.log('Google Client Token check complete.');
        } catch (error) {
            console.error('Error checking/refreshing Google Client Token:', error);
            this.clearTokens();
            throw error; // Propagate error
        }
    }

    startTokenRefreshManager() {
        if (!config.googleClientToken) {
            console.log('No Google Client Token configured. Manager not started.');
            return;
        }
        tokenQueueManager.bootstrapRefresh('google');
    }

    async sendMessage(spaceId: string, text: string): Promise<any> {
        if (!spaceId) {
            throw new Error('Space ID is required');
        }

        const url = `https://chat.googleapis.com/v1/${spaceId}/messages`;

        const response = await this.client.request({
            url,
            method: 'POST',
            data: {
                text: text
            }
        });

        return response.data;
    }
}

export const chatService = new ChatService();
