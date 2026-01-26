import { Queue, Worker, Job } from 'bullmq';
import { config } from '../../config';

type RefreshHandler = () => Promise<number>; // Returns next expiry timestamp (ms)

export class TokenQueueManager {
    private queue: Queue;
    private worker: Worker;
    private handlers: Map<string, RefreshHandler> = new Map();

    constructor() {
        const connection = {
            host: config.redisHost,
            port: config.redisPort
        };

        this.queue = new Queue('token-refresh', { connection });

        this.worker = new Worker('token-refresh', async (job: Job) => {
            const { provider } = job.data;
            console.log(`[TokenQueue] Processing refresh for provider: ${provider}`);

            const handler = this.handlers.get(provider);
            if (!handler) {
                console.error(`[TokenQueue] No handler registered for provider: ${provider}`);
                throw new Error(`No handler for provider ${provider}`);
            }

            try {
                // Execute handler and get next expiry time
                const nextExpiry = await handler();
                this.scheduleNextRefresh(provider, nextExpiry);
            } catch (error) {
                console.error(`[TokenQueue] Error refreshing token for ${provider}:`, error);
                // Optionally re-throw to let BullMQ handle retries, 
                // or handle gracefully. For now, let's stop scheduling to avoid loops if persistent error.
                throw error;
            }
        }, { connection });

        this.worker.on('completed', (job) => {
            console.log(`[TokenQueue] Job ${job.id} completed for ${job.data.provider}`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`[TokenQueue] Job ${job?.id} failed:`, err);
        });

        console.log('[TokenQueue] Initialized Queue and Worker');
    }

    registerHandler(provider: string, handler: RefreshHandler) {
        this.handlers.set(provider, handler);
        console.log(`[TokenQueue] Registered handler for: ${provider}`);
    }

    async scheduleNextRefresh(provider: string, expiryDate: number) {
        const now = Date.now();
        const timeToExpiry = expiryDate - now;

        // Refresh 5 minutes before expiry
        const refreshBuffer = 5 * 60 * 1000;
        let delay = timeToExpiry - refreshBuffer;

        if (delay <= 0) {
            console.log(`[TokenQueue] Token for ${provider} is expired or close to expiry. Scheduling immediate refresh.`);
            delay = 1000;
        }

        console.log(`[TokenQueue] Scheduling next refresh for ${provider} in ${Math.round(delay / 1000)}s`);

        // Remove existing delayed jobs for this provider to avoid duplicates/overlap? 
        // BullMQ allows unique job IDs. We can use provider name as ID if we want only one active job per provider.
        await this.queue.add('refresh-token', { provider }, {
            delay,
            jobId: `refresh-${provider}-${Date.now()}`, // Unique ID for every cycle
            removeOnComplete: true,
            removeOnFail: 100 // Keep last 100 failed jobs for inspection
        });
    }

    async bootstrapRefresh(provider: string) {
        console.log(`[TokenQueue] Bootstrapping refresh for ${provider}...`);
        // Just trigger the logic immediately (or check current state)
        // We can add a specialized job with 0 delay, or call logic directly?
        // Let's add an immediate job to check/refresh and set the cycle.
        await this.queue.add('refresh-token', { provider }, {
            jobId: `bootstrap-${provider}-${Date.now()}`,
            removeOnComplete: true
        });
    }
}

export const tokenQueueManager = new TokenQueueManager();
