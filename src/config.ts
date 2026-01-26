import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    spaceId: process.env.SPACE_ID,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleClientScope: process.env.GOOGLE_CLIENT_SCOPE || 'https://www.googleapis.com/auth/chat.messages',
    googleProjectNumber: process.env.GOOGLE_PROJECT_NUMBER,
    appHost: process.env.APP_HOST || `http://localhost:${process.env.PORT || 3000}`,
    googleClientToken: process.env.GOOGLE_CLIENT_TOKEN,
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
};
