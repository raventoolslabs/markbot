import express from 'express';
import { config } from './config';
import { baseRouter } from './routes';

const app = express();
app.use(express.json());

// Routes
app.use('/api', baseRouter);

if (require.main === module) {
    app.listen(config.port, () => {
        console.log(`Server is running on port ${config.port}`);
    });
}

export { app };
