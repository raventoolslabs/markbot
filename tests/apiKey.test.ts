import request from 'supertest';
import { app } from '../src/app';
import { listApiKeys, createApiKey, deleteApiKey } from '../src/api/http/controllers/apiKey.controller';

jest.mock('../src/api/http/controllers/apiKey.controller');
jest.mock('../src/api/http/middlewares/authentication.middleware', () => ({
    authenticationMiddleware: jest.fn((req, res, next) => {
        (req as any).user = { userId: '123', email: 'test@example.com' };
        next();
    }),
}));

describe('API Key Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/keys', () => {
        it('should list API keys', async () => {
            (listApiKeys as jest.Mock).mockImplementation((req, res) => res.json([{ id: 'key123' }]));

            const res = await request(app).get('/api/keys');

            expect(res.status).toBe(200);
            expect(res.body).toEqual([{ id: 'key123' }]);
        });
    });

    describe('POST /api/keys', () => {
        it('should create API key', async () => {
            (createApiKey as jest.Mock).mockImplementation((req, res) => res.status(201).json({ key: 'newKey' }));

            const res = await request(app).post('/api/keys').send({ name: 'Test Key' });

            expect(res.status).toBe(201);
            expect(res.body.key).toBe('newKey');
        });
    });

    describe('DELETE /api/keys/:id', () => {
        it('should delete API key', async () => {
            (deleteApiKey as jest.Mock).mockImplementation((req, res) => res.status(200).json({ success: true }));

            const res = await request(app).delete('/api/keys/key123');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
