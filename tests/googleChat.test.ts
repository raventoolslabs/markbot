import { ChatService } from '../src/modules/google/chatService';

// Mock dependencies
jest.mock('google-auth-library');
import { OAuth2Client } from 'google-auth-library';
import { config } from '../src/config';

describe('ChatService', () => {
    let chatService: ChatService;
    let mockRequest: jest.Mock;

    beforeAll(() => {
        // Setup Test Config
        process.env.SPACE_ID = 'test-space-id';
        process.env.GOOGLE_CLIENT_ID = 'test-client-id';
        process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

        process.env.GOOGLE_CLIENT_SCOPE = 'test-scope';

        // Reload config to pick up new env vars if necessary, 
        // but since config is a simple object exported, changing process.env 
        // *might* not update the already imported config object values depending on how it was initialized.
        // However, in our config.ts, it reads process.env at definition time. 
        // Generally, we should mock the config module itself for safety, or ensure this runs before config is imported?
        // But Jest hoisting... let's mock the config module to be safe.
    });

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Mock the OAuth2Client request method
        mockRequest = jest.fn().mockResolvedValue({ data: { name: 'messages/123', text: 'Hello' } });
        (OAuth2Client as unknown as jest.Mock).mockImplementation(() => ({
            request: mockRequest
        }));

        // We need to re-require or rely on the mock if we want to check constructor args cleanly
    });

    it('should be defined', () => {
        // We need to make sure config has values for the constructor check. 
        // Since we can't easily re-evaluate config.ts in Jest without jest.resetModules,
        // let's pass a slightly different approach: we know what config.ts *does* read.
        // Or we rely on the mocked config values below.

        // Actually, let's proceed with instantiating.
        // To ensure we test the *actual* usage of config values, we can mock the `config` import.
    });
});

// Better test structure to handle config mocking
jest.mock('../src/config', () => ({
    config: {
        googleClientId: 'mock-client-id',
        googleClientSecret: 'mock-client-secret',
        spaceId: 'mock-space-id',
        port: 3000,
        appHost: 'http://localhost:3000'
    }
}));

describe('ChatService with Mocks', () => {
    let chatService: ChatService;
    let mockRequest: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest = jest.fn().mockResolvedValue({ data: { name: 'messages/123', text: 'Hello' } });
        (OAuth2Client as unknown as jest.Mock).mockImplementation(() => ({
            request: mockRequest
        }));

        chatService = new ChatService();
    });

    it('should initialize OAuth2Client with correct config', () => {
        expect(OAuth2Client).toHaveBeenCalledWith(
            'mock-client-id',
            'mock-client-secret',
            'http://localhost:3000/api/google/oauth2-credential/callback'
        );
    });

    it('should send a message to the configured space', async () => {
        const messageText = 'Hello World from Test';
        const spaceId = 'mock-space-id';

        const result = await chatService.sendMessage(spaceId, messageText);

        expect(mockRequest).toHaveBeenCalledWith({
            url: `https://chat.googleapis.com/v1/spaces/${spaceId}/messages`,
            method: 'POST',
            data: {
                text: messageText
            }
        });

        expect(result).toEqual({ name: 'messages/123', text: 'Hello' });
    });
});
