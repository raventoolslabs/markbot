import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config';
import { tokenQueueManager } from '../queue/tokenQueue';
import { logger } from '../../util/logger';

export class ChatService {
  private client: OAuth2Client;
  private initialized: boolean = false;

  constructor() {
    this.client = new OAuth2Client(
      config.googleClientId,
      config.googleClientSecret,
      `${config.appHost}/api/google/oauth2/callback`,
    );

    this.client.on('tokens', (tokens) => {
      logger.info('Tokens refreshed via event', 'ChatService');
      this.saveTokens(tokens);
    });

    // Register with Generic Queue Manager
    tokenQueueManager.registerHandler('google', async () => {
      logger.debug('Queue requested token refresh/check', 'ChatService');
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

    logger.info('Initializing ChatService with persistent tokens...', 'ChatService');

    // 1. Try to load from Redis first
    const persistentToken = await tokenQueueManager.getToken('google');

    if (persistentToken) {
      this.client.setCredentials(persistentToken);
      config.googleClientToken = JSON.stringify(persistentToken);
      logger.info('Google Chat credentials loaded from Redis', 'ChatService');
    } else if (config.googleClientToken) {
      // 2. Fallback to config/env if Redis is empty (e.g. first run)
      try {
        const tokens = JSON.parse(config.googleClientToken);
        this.client.setCredentials(tokens);
        logger.info('Google Chat credentials loaded from config (fallback)', 'ChatService');

        // Save it to Redis for next time
        await this.saveTokens(tokens);
      } catch (error) {
        logger.error('Error parsing Google Chat token from config', 'ChatService', error);
      }
    } else {
      logger.warn('No Google Chat credentials found in Redis or Config.', 'ChatService');
    }

    this.initialized = true;
  }

  private async saveTokens(tokens: any) {
    // Update in-memory config
    const tokenString = JSON.stringify(tokens);
    config.googleClientToken = tokenString;

    // Persist to Redis
    await tokenQueueManager.setToken('google', tokens);
    logger.debug('Tokens updated and persisted', 'ChatService');
  }

  getAuthUrl(): string {
    const scopes = config.googleClientScope;
    logger.debug(`Generating Auth URL with scopes: ${scopes}`, 'ChatService');
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
    logger.warn('Clearing invalid/expired tokens...', 'ChatService');
    this.client.setCredentials({});
    config.googleClientToken = undefined;
    await tokenQueueManager.deleteToken('google');
  }

  async checkAndRefreshTokens() {
    // Ensure we are initialized before checking
    if (!this.initialized) await this.initialize();

    if (!config.googleClientToken) {
      logger.warn('No Google Client Token found to refresh.', 'ChatService');
      throw new Error('No token configured');
    }

    try {
      logger.debug('Checking Google Client Token...', 'ChatService');
      await this.client.getAccessToken(); // Refresh if needed
      logger.info('Google Client Token check complete.', 'ChatService');
    } catch (error) {
      logger.error('Error checking/refreshing Google Client Token', 'ChatService', error);
      await this.clearTokens();
      throw error;
    }
  }

  startTokenRefreshManager() {
    if (!config.googleClientToken) {
      logger.warn('No Google Client Token configured. Manager not started.', 'ChatService');
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
        text: text,
      },
    });

    return response.data;
  }
}

export const chatService = new ChatService();
