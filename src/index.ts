import express from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
import { config } from './config';
import { baseRouter } from './routes';
import { swaggerSpec, swaggerDocumentationOptions } from './swagger';
import { errorHandler } from './middleware/errorHandler';
import { chatService } from './modules/google/chatService';

const app = express();

app.use(express.json());

// Assets
app.use(express.static(path.join(__dirname, '../web/public')));

// Logger
app.use(morgan('[:method] :url - :status - :response-time ms'));

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
        // Check and refresh tokens before starting the server, and start scheduler
        chatService.startTokenRefreshManager();

        app.listen(config.port, () => {
            console.log(`Server is running on port ${config.port}`);
        });
    })();
}

export { app };
