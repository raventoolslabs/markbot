import request from 'supertest';
import { app } from '../src/index';

describe('Chat API', () => {
    it('POST /api/chat/message should echo the message', async () => {
        const message = 'Hello Markbot';
        const res = await request(app)
            .post('/api/chat/message')
            .send({ message });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ response: message });
    });
});
