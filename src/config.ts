import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  spaceId: process.env.SPACE_ID,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleClientScope:
    process.env.GOOGLE_CLIENT_SCOPE || 'https://www.googleapis.com/auth/chat.messages',
  googleProjectNumber: process.env.GOOGLE_PROJECT_NUMBER,
  appHost: process.env.APP_HOST || `http://localhost:${process.env.PORT || 3000}`,
  googleClientToken: process.env.GOOGLE_CLIENT_TOKEN,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  // Database
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: parseInt(process.env.DB_PORT || '5432', 10),
  dbUser: process.env.DB_USER || 'markbot_user',
  dbPassword: process.env.DB_PASSWORD || 'markbot_password',
  dbName: process.env.DB_NAME || 'markbot_vector',
  dbSchema: process.env.DB_SCHEMA || 'markbot',
  databaseUrl: process.env.DATABASE_URL,
  // Vectorization
  openaiApiKey: process.env.OPENAI_API_KEY,
};
