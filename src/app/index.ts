import express from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
import { config } from './config';
import { baseRouter } from '@/api/http/routes';
import { swaggerSpec, swaggerDocumentationOptions } from '@/api/http/openapi/swagger';
import { errorHandler } from '@/api/http/middlewares/error-handler.middleware';
import { googleChatService } from '@/app/services/googleChat.service';
import { managerDb } from '@/infrastructure/db/client';

import { logger } from '@/infrastructure/logging/logger';

const app = express();

app.set('etag', false);

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  next();
});

// Assets
app.use(express.static(path.join(__dirname, '../../web/public')));

// Logger
morgan.token('custom-date', () => {
  const now = new Date();
  return (
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(now.getDate()).padStart(2, '0') +
    ' ' +
    String(now.getHours()).padStart(2, '0') +
    ':' +
    String(now.getMinutes()).padStart(2, '0') +
    ':' +
    String(now.getSeconds()).padStart(2, '0')
  );
});

morgan.token('clean-ip', (req) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ip = (req as any).ip || req.socket.remoteAddress || '';
  return ip.replace('::ffff:', '');
});

app.use(
  morgan('[:custom-date] [INFO] :method :url :status - :response-time ms - :clean-ip', {
    skip: (req) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const url = (req as any).originalUrl || req.url || '';
      return !url.startsWith('/api');
    },
  }),
);

// Swagger Redirect Loop Fix
app.use('/api/docs', (req, res, next) => {
  if (req.originalUrl === '/api/docs' || req.originalUrl.split('?')[0] === '/api/docs') {
    return res.redirect(301, '/api/docs/');
  }

  next();
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerDocumentationOptions));

// Routes
app.use('/api', baseRouter);

// Error Handler (must be after all routes)
app.use(errorHandler);

if (require.main === module) {
  (async () => {
    // Initialize Database
    await managerDb.initialize();

    // Initialize Google Chat Client (restores tokens from Redis/Env)
    try {
      await googleChatService.startTokenRefreshManager();
    } catch (error) {
      logger.error('Failed to initialize Google Chat Service', 'App', error);
    }

    // Check and refresh tokens before starting the server, and start scheduler
    googleChatService.startTokenRefreshManager();

    app.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`, 'Server');
    });
  })();
}

export { app };
