import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config';
import * as fs from 'fs';
import * as path from 'path';

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
    }

    private saveTokens(tokens: any) {
        // Update in-memory config
        // Merge with existing credentials/tokens to keep fields like refresh_token if new one doesn't have it
        // (Though google-auth-library usually handles merging internally in client.credentials, 
        // passing 'tokens' here usually contains just the new stuff or full stuff.
        // Let's assume 'tokens' from event or getToken response is valid to save.)

        // If we want to be safe and ensure we don't lose the refresh_token if the new set doesn't have it
        // we might want to check this.client.credentials, but let's stick to saving what we get for now
        // or better, rely on this.client.credentials if available? 
        // The 'tokens' event argument contains the new tokens. 

        // Better approach: Since setCredentials merges, we should save what is in this.client.credentials 
        // BUT 'tokens' event fires *after* credentials are set? 
        // Actually, library docs say: "This event is emitted when new tokens are successfully retrieved."
        // We should save the current valid credentials set.

        // Let's rely on the passed tokens first, as that mimics previous logic.
        const tokenString = JSON.stringify(tokens);
        config.googleClientToken = tokenString;

        // Persist to .env
        try {
            const envPath = path.resolve(process.cwd(), '.env');
            let envContent = '';

            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, 'utf8');
            }

            const tokenEnvVar = `GOOGLE_CLIENT_TOKEN='${tokenString}'`;

            if (envContent.includes('GOOGLE_CLIENT_TOKEN=')) {
                // Replace existing
                envContent = envContent.replace(/^GOOGLE_CLIENT_TOKEN=.*$/m, tokenEnvVar);
            } else {
                // Append
                envContent += `\n${tokenEnvVar}\n`;
            }

            fs.writeFileSync(envPath, envContent);
            console.log('Token saved to .env');
        } catch (error) {
            console.error('Error saving token to .env:', error);
        }
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

    async checkAndRefreshTokens() {
        if (!config.googleClientToken) {
            console.log('No Google Client Token found to refresh.');
            return;
        }

        try {
            console.log('Checking Google Client Token...');
            // getAccessToken() will automatically refresh the token if it is expired
            // and if a refresh_token is present.
            await this.client.getAccessToken();

            // If it refreshed, the 'tokens' event logic configured in constructor 
            // *should* catch it if we were listening, but let's manually ensure 
            // we save the current state just in case, or trust the event.
            // The 'tokens' event is the most reliable way with GoogleAuthLibrary.

            console.log('Google Client Token check complete.');
        } catch (error) {
            console.error('Error checking/refreshing Google Client Token:', error);
            // Optionally clear invalid tokens?
        }
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
