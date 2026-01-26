import request from 'supertest';
import { app } from '../src/index';

// Mock auth middleware
jest.mock('../src/modules/google/auth', () => ({
    verifyGoogleChatToken: (req: any, res: any, next: any) => next(),
}));

// Mock message handler
jest.mock('../src/modules/chat/messageHandler', () => ({
    messageHandler: {
        handleMessage: jest.fn().mockResolvedValue({ text: 'Mock Response' }),
        formatErrorResponse: jest.fn().mockReturnValue({ text: 'Error Response' }),
    },
}));

import { messageHandler } from '../src/modules/chat/messageHandler';

describe('Google Chat Webhook Events', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should handle flat MESSAGE event structure', async () => {
        const flatEvent = {
            type: 'MESSAGE',
            message: {
                text: 'Hello flat',
                sender: {
                    displayName: 'User Name',
                    name: 'users/123',
                },
            },
            space: {
                name: 'spaces/abc',
            },
        };

        const res = await request(app)
            .post('/api/google/message')
            .send(flatEvent);

        expect(res.status).toBe(200);
        expect(res.body.text).toBe('Mock Response');
        expect(messageHandler.handleMessage).toHaveBeenCalledWith({
            text: 'Hello flat',
            userName: 'User Name',
            userId: 'users/123',
            spaceId: 'spaces/abc',
            platform: 'google',
        });
    });

    it('should handle nested messagePayload event structure', async () => {
        const nestedEvent = {
            commonEventObject: {
                userLocale: 'es',
                hostApp: 'CHAT',
            },
            chat: {
                user: {
                    name: 'users/105940076300700230051',
                    displayName: 'Alejandro Silva',
                },
                messagePayload: {
                    space: {
                        name: 'spaces/nested-space',
                    },
                    message: {
                        text: 'Hello nested',
                        sender: {
                            displayName: 'Alejandro Silva',
                            name: 'users/105940076300700230051',
                        },
                    },
                },
            },
        };

        const res = await request(app)
            .post('/api/google/message')
            .send(nestedEvent);

        expect(res.status).toBe(200);
        expect(res.body.text).toBe('Mock Response');
        expect(messageHandler.handleMessage).toHaveBeenCalledWith({
            text: 'Hello nested',
            userName: 'Alejandro Silva',
            userId: 'users/105940076300700230051',
            spaceId: 'spaces/nested-space',
            platform: 'google',
        });
    });

    it('should handle ADDED_TO_SPACE event', async () => {
        const addedEvent = {
            type: 'ADDED_TO_SPACE',
            space: {
                name: 'spaces/new-space',
            },
        };

        const res = await request(app)
            .post('/api/google/message')
            .send(addedEvent);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({});
        expect(messageHandler.handleMessage).not.toHaveBeenCalled();
    });
});
