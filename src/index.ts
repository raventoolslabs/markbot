import express from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
import { config } from './config';
import { baseRouter } from './routes';
import { swaggerSpec, swaggerDocumentationOptions } from './swagger';
import { errorHandler } from './middleware/errorHandler';
import { chatService } from './modules/google/chatService';
import { vectorDb } from './modules/vector/db';

import { logger } from './util/logger';

const app = express();

app.set('etag', false);

app.use(express.json());

// Assets
app.use(express.static(path.join(__dirname, '../web/public')));

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
  const ip = (req as any).ip || req.socket.remoteAddress || '';
  return ip.replace('::ffff:', '');
});

app.use(
  morgan('[:custom-date] [INFO] :method :url :status - :response-time ms - :clean-ip', {
    skip: (req) => {
      const url = (req as any).originalUrl || req.url || '';
      return !url.startsWith('/api');
    },
  }),
);

// Serve specific favicons for Swagger UI (it requests them relative to /api/docs/)
app.get('/api/docs/favicon-*.png', (req, res) => {
  const filename = path.basename(req.path);
  res.sendFile(path.join(__dirname, '../web/public/img', filename));
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerDocumentationOptions));

// Routes
app.use('/api', baseRouter);

// Error Handler (must be after all routes)
app.use(errorHandler);

if (require.main === module) {
  (async () => {
    // Initialize Vector Database
    await vectorDb.initialize();

    // Initialize ChatService (load tokens from Redis/Config)
    await chatService.initialize();

    // Check and refresh tokens before starting the server, and start scheduler
    chatService.startTokenRefreshManager();

    app.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`, 'Server');
    });
  })();
}

export { app };
