import request from 'supertest';
import { app } from '../src/app';
import { googleChatController } from '../src/api/http/controllers/google-chat.controller';
import { googleAuthMiddleware } from '../src/api/http/middlewares/google-auth.middleware';

jest.mock('../src/api/http/controllers/google-chat.controller');
jest.mock('../src/api/http/middlewares/google-auth.middleware', () => ({
    googleAuthMiddleware: jest.fn((req, res, next) => next())
}));

describe('Google Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/google/auth', () => {
        it('should handle auth', async () => {
            (googleChatController.handleAuth as jest.Mock).mockImplementation((req, res) => res.json({ url: 'http://auth' }));

            const res = await request(app).get('/api/google/auth');

            expect(res.status).toBe(200);
            expect(res.body.url).toBe('http://auth');
        });
    });

    describe('POST /api/google/message', () => {
        it('should handle messages', async () => {
            (googleChatController.handleMessage as jest.Mock).mockImplementation((req, res) => res.json({ text: 'Reply' }));

            const res = await request(app)
                .post('/api/google/message')
                .send({ type: 'MESSAGE', message: { text: 'Hello' } });

            expect(res.status).toBe(200);
            expect(res.body.text).toBe('Reply');
        });
    });

    describe('GET /api/google/oauth2/callback', () => {
        it('should handle callback', async () => {
            (googleChatController.handleCallback as jest.Mock).mockImplementation((req, res) => res.status(200).send('OK'));

            const res = await request(app)
                .get('/api/google/oauth2/callback')
                .query({ code: 'code123', state: 'state123' });

            expect(res.status).toBe(200);
            expect(res.text).toBe('OK');
        });
    });
});
