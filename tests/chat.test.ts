import request from 'supertest';
import { app } from '../src/app';
import { chatController } from '../src/api/http/controllers/chat.controller';

jest.mock('../src/api/http/controllers/chat.controller');

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
                .send({ message: 'Hi', userName: 'Test', userId: '123' });

            expect(res.status).toBe(200);
            expect(res.body.response).toBe('Hello!');
        });

        it('should handle errors', async () => {
            (chatController.handleMessage as jest.Mock).mockRejectedValue(new Error('Internal Error'));
            (chatController.formatErrorResponse as jest.Mock).mockReturnValue({
                text: 'Error occurred',
                metadata: {}
            });

            const res = await request(app)
                .post('/api/chat/message')
                .send({ message: 'Hi', userName: 'Test', userId: '123' });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe('Error occurred');
        });
    });
});
