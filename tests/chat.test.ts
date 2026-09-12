import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { chatController } from '../src/api/http/controllers/chat.controller';

jest.mock('../src/api/http/controllers/chat.controller');

const secret = process.env.JWT_SECRET || 'default_secret_change_me';

const userToken = jwt.sign({ userId: 'user-1', email: 'test@example.com' }, secret, { expiresIn: '1h' });
const widgetToken = jwt.sign(
    { userId: 'user-1', widgetId: 'widget-1', type: 'widget_token' },
    secret,
    { expiresIn: '1h' },
);

describe('Chat Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/chat/message', () => {
        it('should process a chat message successfully', async () => {
            const mockResponse = {
                text: 'Hello!',
                images: [],
                metadata: { source: 'test' }
            };
            (chatController.handleMessage as jest.Mock).mockResolvedValue(mockResponse);

            const res = await request(app)
                .post('/api/chat/message')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: 'Hi', userName: 'Test', userId: '123' });

            expect(res.status).toBe(200);
            expect(res.body.response).toBe('Hello!');
        });

        it('should accept a widget token', async () => {
            (chatController.handleMessage as jest.Mock).mockResolvedValue({
                text: 'Hello!',
                images: [],
                metadata: {}
            });

            const res = await request(app)
                .post('/api/chat/message')
                .set('Authorization', `Bearer ${widgetToken}`)
                .send({ message: 'Hi' });

            expect(res.status).toBe(200);
        });

        it('should reject a request without token', async () => {
            const res = await request(app)
                .post('/api/chat/message')
                .send({ message: 'Hi' });

            expect(res.status).toBe(401);
            expect(chatController.handleMessage).not.toHaveBeenCalled();
        });

        it('should reject an invalid token', async () => {
            const res = await request(app)
                .post('/api/chat/message')
                .set('Authorization', 'Bearer not-a-jwt')
                .send({ message: 'Hi' });

            expect(res.status).toBe(401);
            expect(chatController.handleMessage).not.toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            (chatController.handleMessage as jest.Mock).mockRejectedValue(new Error('Internal Error'));
            (chatController.formatErrorResponse as jest.Mock).mockReturnValue({
                text: 'Error occurred',
                metadata: {}
            });

            const res = await request(app)
                .post('/api/chat/message')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: 'Hi', userName: 'Test', userId: '123' });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe('Error occurred');
        });
    });
});
