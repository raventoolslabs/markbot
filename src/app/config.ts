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
  jwtSecret: process.env.JWT_SECRET,
  encryptionKey: process.env.ENCRYPTION_KEY,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  // Database
  databaseUrl: process.env.DATABASE_URL,
  vector: {
    queryLimit: parseInt(process.env.VECTOR_QUERY_LIMIT || '6', 10),
  },
  // Documentos e índice semántico: viven en Pergamo.
  pergamo: {
    url: process.env.PERGAMO_URL || 'http://localhost:3000',
    organization: process.env.PERGAMO_ORGANIZATION || 'markbot',
    password: process.env.PERGAMO_PASSWORD || '',
  },
  chat: {
    provider: process.env.CHAT_PROVIDER || 'openai', // 'openai' | 'ollama'
    modelName: process.env.CHAT_MODEL_NAME || 'gpt-4o',
    temperature: parseFloat(process.env.CHAT_TEMPERATURE || '0.7'),
    apiKey: process.env.CHAT_API_KEY,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || 'user',
    password: process.env.SMTP_PASSWORD || 'password',
    from: process.env.SMTP_FROM || `"${process.env.BOT_NAME || 'Mark'}Bot" <noreply@markbot.com>`,
  },
  botName: process.env.BOT_NAME || 'Mark',
};
