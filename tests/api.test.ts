import request from 'supertest';
import { app } from '../src/index';

describe('API Endpoints', () => {
    it('GET /api/version should return version', async () => {
        const res = await request(app).get('/api/version');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('version');
    });

    it('GET /api/health should return ok', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body).toHaveProperty('timestamp');
    });
});
