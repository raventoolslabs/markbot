import { HandleChatMessageHandler } from '../src/app/use-cases/chat/commands/handle-chat-message.handler';
import { HandleChatMessageCommand } from '../src/app/use-cases/chat/commands/handle-chat-message.command';
import { SearchDocumentsHandler } from '../src/app/use-cases/document/queries/search-documents.handler';
import { DocumentRepository } from '../src/app/ports/repositories/document.repository';

const repository = (overrides: Partial<DocumentRepository>): DocumentRepository => ({
    search: jest.fn(),
    list: jest.fn(),
    getById: jest.fn(),
    getChunks: jest.fn(),
    upload: jest.fn(),
    delete: jest.fn(),
    ...overrides,
});

describe('Chat against Pergamo', () => {
    it('says the knowledge base failed instead of answering as if it were empty', async () => {
        const repo = repository({ search: jest.fn().mockRejectedValue(new Error('Pergamo unreachable')) });
        const handler = new HandleChatMessageHandler(new SearchDocumentsHandler(repo));

        const response = await handler.execute({ request: { text: '¿Qué dice el manual?' } } as unknown as HandleChatMessageCommand);

        expect(response.text).toBe('Lo siento, tuve un problema al consultar mi base de datos de conocimientos.');
    });

    it('cites each chunk with its document name and section, fetching each document once', async () => {
        const getById = jest.fn().mockResolvedValue({
            id: 'd1', name: 'manual', originalName: 'manual.pdf', creationDate: new Date(), metadata: {},
        });
        const repo = repository({
            search: jest.fn().mockResolvedValue([
                { documentId: 'd1', content: 'a', headingPath: ['Cap 1', 'Alcance'], similarity: 0.9 },
                { documentId: 'd1', content: 'b', section: 'Intro', headingPath: [], similarity: 0.8 },
            ]),
            getById,
        });

        const results = await new SearchDocumentsHandler(repo).execute({ query: 'q' });

        expect(results).toEqual([
            { content: 'a', documentName: 'manual', section: 'Alcance' },
            { content: 'b', documentName: 'manual', section: 'Intro' },
        ]);
        expect(getById).toHaveBeenCalledTimes(1);
    });
});
