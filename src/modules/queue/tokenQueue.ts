import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../../config';
import { logger } from '../../util/logger';

type RefreshHandler = () => Promise<number>; // Returns next expiry timestamp (ms)

export class TokenQueueManager {
  private queue: Queue;
  private worker: Worker;
  private redis: Redis;
  private handlers: Map<string, RefreshHandler> = new Map();

  constructor() {
    const connection = {
      host: config.redisHost,
      port: config.redisPort,
    };

    this.redis = new Redis(connection);
    this.queue = new Queue('token-refresh', { connection });

    this.worker = new Worker(
      'token-refresh',
      async (job: Job) => {
        const { provider } = job.data;
        logger.info(`Processing refresh for provider: ${provider}`, 'TokenQueue');

        const handler = this.handlers.get(provider);
        if (!handler) {
          logger.error(`No handler registered for provider: ${provider}`, 'TokenQueue');
          throw new Error(`No handler for provider ${provider}`);
        }

        try {
          // Execute handler and get next expiry time
          const nextExpiry = await handler();
          this.scheduleNextRefresh(provider, nextExpiry);
        } catch (error) {
          logger.error(`Error refreshing token for ${provider}`, 'TokenQueue', error);
          // Optionally re-throw to let BullMQ handle retries
          throw error;
        }
      },
      { connection },
    );

    this.worker.on('completed', (job) => {
      logger.debug(`Job ${job.id} completed for ${job.data.provider}`, 'TokenQueue');
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed`, 'TokenQueue', err);
    });

    logger.info('Initialized Queue and Worker', 'TokenQueue');
  }

  registerHandler(provider: string, handler: RefreshHandler) {
    this.handlers.set(provider, handler);
    logger.info(`Registered handler for: ${provider}`, 'TokenQueue');
  }

  async scheduleNextRefresh(provider: string, expiryDate: number) {
    const now = Date.now();
    const timeToExpiry = expiryDate - now;

    // Refresh 5 minutes before expiry
    const refreshBuffer = 5 * 60 * 1000;
    let delay = timeToExpiry - refreshBuffer;

    if (delay <= 0) {
      logger.info(
        `Token for ${provider} is expired or close to expiry. Scheduling immediate refresh.`,
        'TokenQueue',
      );
      delay = 1000;
    }

    logger.info(
      `Scheduling next refresh for ${provider} in ${Math.round(delay / 1000)}s`,
      'TokenQueue',
    );

    await this.queue.add(
      'refresh-token',
      { provider },
      {
        delay,
        jobId: `refresh-${provider}`, // Deterministic ID to prevent duplicates
        removeOnComplete: true,
        removeOnFail: 100, // Keep last 100 failed jobs for inspection
      },
    );
  }

  async bootstrapRefresh(provider: string) {
    logger.info(`Bootstrapping refresh for ${provider}...`, 'TokenQueue');
    await this.queue.add(
      'refresh-token',
      { provider },
      {
        jobId: `refresh-${provider}`, // Use the same deterministic ID
        removeOnComplete: true,
      },
    );
  }

  // Redis KV Storage methods
  async setToken(provider: string, tokenData: any): Promise<void> {
    const key = `token:${provider}`;
    await this.redis.set(key, JSON.stringify(tokenData));
    logger.debug(`Token preserved in Redis for ${provider}`, 'TokenQueue');
  }

  async getToken(provider: string): Promise<any | null> {
    const key = `token:${provider}`;
    const data = await this.redis.get(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  }

  async deleteToken(provider: string): Promise<void> {
    const key = `token:${provider}`;
    await this.redis.del(key);
    logger.debug(`Token deleted from Redis for ${provider}`, 'TokenQueue');
  }
}

export const tokenQueueManager = new TokenQueueManager();
