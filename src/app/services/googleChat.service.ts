import { OAuth2Client } from 'google-auth-library';
import { config } from '@/app/config';
import { tokenQueueManager } from '@/infrastructure/queue/tokenQueue';
import { logger } from '@/infrastructure/logging/logger';
import { createOAuthClient } from '@/infrastructure/google/oauth.client';

export class GoogleChatService {
  private client: OAuth2Client;
  private initialized: boolean = false;

  constructor() {
    this.client = createOAuthClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.client.on('tokens', (tokens: any) => {
      logger.info('Tokens refreshed via event', 'GoogleChatService');
      this.saveTokens(tokens);
    });

    // Register with Generic Queue Manager
    tokenQueueManager.registerHandler('google', async () => {
      logger.debug('Queue requested token refresh/check', 'GoogleChatService');
      await this.checkAndRefreshTokens();

      // Return next expiry date
      const credentials = this.client.credentials;

      if (credentials && credentials.expiry_date) {
        return credentials.expiry_date;
      } else {
        // If no expiry, assume 1 hour to re-check
        return Date.now() + 3600 * 1000;
      }
    });
  }

  async initialize() {
    if (this.initialized) return;

    logger.info('Initializing GoogleChatService with persistent tokens...', 'GoogleChatService');

    // 1. Try to load from Redis first
    const persistentToken = await tokenQueueManager.getToken('google');

    if (persistentToken) {
      this.client.setCredentials(persistentToken);
      config.googleClientToken = JSON.stringify(persistentToken);
      logger.info('Google Chat credentials loaded from Redis', 'GoogleChatService');
    } else if (config.googleClientToken) {
      // 2. Fallback to config/env if Redis is empty (e.g. first run)
      try {
        const tokens = JSON.parse(config.googleClientToken);
        this.client.setCredentials(tokens);
        logger.info('Google Chat credentials loaded from config (fallback)', 'GoogleChatService');

        // Save it to Redis for next time
        await this.saveTokens(tokens);
      } catch (error) {
        logger.error('Error parsing Google Chat token from config', 'GoogleChatService', error);
      }
    } else {
      logger.warn('No Google Chat credentials found in Redis or Config.', 'GoogleChatService');
    }

    this.initialized = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async saveTokens(tokens: any) {
    // Update in-memory config
    const tokenString = JSON.stringify(tokens);
    config.googleClientToken = tokenString;

    // Persist to Redis
    await tokenQueueManager.setToken('google', tokens);
    logger.debug('Tokens updated and persisted', 'GoogleChatService');
  }

  getAuthUrl(): string {
    const scopes = config.googleClientScope;
    logger.debug(`Generating Auth URL with scopes: ${scopes}`, 'GoogleChatService');
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
  }

  async getToken(code: string) {
    const { tokens } = await this.client.getToken(code);
    this.client.setCredentials(tokens);
    await this.saveTokens(tokens);
    this.startTokenRefreshManager();
    return tokens;
  }

  private async clearTokens() {
    logger.warn('Clearing invalid/expired tokens...', 'GoogleChatService');
    this.client.setCredentials({});
    config.googleClientToken = undefined;
    await tokenQueueManager.deleteToken('google');
  }

  async checkAndRefreshTokens() {
    // Ensure we are initialized before checking
    if (!this.initialized) await this.initialize();

    if (!config.googleClientToken) {
      logger.warn('No Google Client Token found to refresh. Skipping cycle.', 'GoogleChatService');
      return;
    }

    try {
      logger.debug('Checking Google Client Token...', 'GoogleChatService');
      await this.client.getAccessToken(); // Refresh if needed
      logger.info('Google Client Token check complete.', 'GoogleChatService');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logger.error('Error checking/refreshing Google Client Token', 'GoogleChatService', error);
      await this.clearTokens();
      throw error;
    }
  }

  startTokenRefreshManager() {
    if (!config.googleClientToken) {
      logger.warn('No Google Client Token configured. Manager not started.', 'GoogleChatService');
      return;
    }

    tokenQueueManager.bootstrapRefresh('google');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async sendMessage(spaceId: string, text: string): Promise<any> {
    if (!spaceId) {
      throw new Error('Space ID is required');
    }

    const url = `https://chat.googleapis.com/v1/${spaceId}/messages`;

    // Ensure token is valid before sending
    await this.checkAndRefreshTokens();

    const response = await this.client.request({
      url,
      method: 'POST',
      data: {
        text: text,
      },
    });

    return response.data;
  }
}

export const googleChatService = new GoogleChatService();
