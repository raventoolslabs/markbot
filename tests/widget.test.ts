import request from 'supertest';
import { app } from '../src/app';
import { getWidgetToken, validateWidgetToken } from '../src/api/http/controllers/widget.controller';

jest.mock('../src/api/http/controllers/widget.controller');

describe('Widget Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/widgets/token', () => {
        it('should get widget token', async () => {
            (getWidgetToken as jest.Mock).mockImplementation((req, res) => res.json({ token: 'token123' }));

            const res = await request(app).post('/api/widgets/token').send({ origin: 'http://test.com' });

            expect(res.status).toBe(200);
            expect(res.body.token).toBe('token123');
        });
    });

    describe('POST /api/widgets/validate', () => {
        it('should validate widget token', async () => {
            (validateWidgetToken as jest.Mock).mockImplementation((req, res) => res.json({ valid: true }));

            const res = await request(app).post('/api/widgets/validate').send({ token: 'token123' });

            expect(res.status).toBe(200);
            expect(res.body.valid).toBe(true);
        });
    });
});
