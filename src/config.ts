import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    spaceId: process.env.SPACE_ID,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleClientScope: process.env.GOOGLE_CLIENT_SCOPE,
    appHost: process.env.APP_HOST || `http://localhost:${process.env.PORT || 3000}`,
};
