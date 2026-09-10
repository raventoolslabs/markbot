import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { config } from '../src/app/config';
import { pergamoDocumentRepository } from '../src/infrastructure/pergamo/pergamo-document.repository';
import { ExternalServiceException } from '../src/domain/exceptions/ExternalServiceException';

jest.mock('../src/infrastructure/pergamo/pergamo-document.repository', () => ({
    pergamoDocumentRepository: {
        search: jest.fn(),
        list: jest.fn(),
        getById: jest.fn(),
        getChunks: jest.fn(),
        upload: jest.fn(),
        delete: jest.fn(),
    },
}));

const repository = pergamoDocumentRepository as jest.Mocked<typeof pergamoDocumentRepository>;
const token = `Bearer ${jwt.sign({ userId: '1', email: 'test@example.com' }, config.jwtSecret || 'default_secret_change_me')}`;

const doc = {
    id: 'doc1',
    name: 'manual',
    originalName: 'manual.pdf',
    creationDate: new Date('2026-09-01T00:00:00Z'),
    metadata: { name: 'manual', original_name: 'manual.pdf' },
};

describe('Documents Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        ['post', '/api/document'],
        ['get', '/api/document/list'],
        ['get', '/api/document/doc1'],
        ['delete', '/api/document/doc1'],
    ] as const)('%s %s returns 401 without token', async (method, path) => {
        const res = await request(app)[method](path);

        expect(res.status).toBe(401);
        expect(repository.list).not.toHaveBeenCalled();
    });

    it('lists documents in the shape the UI expects', async () => {
        repository.list.mockResolvedValue([doc]);

        const res = await request(app).get('/api/document/list').set('Authorization', token);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([{
            id: 'doc1',
            path: 'manual.pdf',
            organization: config.pergamo.organization,
            creationDate: '2026-09-01T00:00:00.000Z',
            metadata: doc.metadata,
        }]);
    });

    it('returns the document with its chunks', async () => {
        repository.getById.mockResolvedValue(doc);
        repository.getChunks.mockResolvedValue([{ id: 7, content: 'text', page: 2, section: 'Intro', headingPath: ['Intro'], length: 4 }]);

        const res = await request(app).get('/api/document/doc1').set('Authorization', token);

        expect(res.status).toBe(200);
        expect(res.body.chunks).toEqual([{ id: 7, content: 'text', metadata: { page: 2, section: 'Intro', chunk_size: 4 } }]);
    });

    it('returns 404 if the document does not exist', async () => {
        repository.getById.mockResolvedValue(undefined);

        const res = await request(app).get('/api/document/doc1').set('Authorization', token);

        expect(res.status).toBe(404);
    });

    it('uploads the file to Pergamo', async () => {
        repository.upload.mockResolvedValue(doc);

        const res = await request(app)
            .post('/api/document')
            .set('Authorization', token)
            .attach('file', Buffer.from('%PDF-1.7'), 'manual.pdf');

        expect(res.status).toBe(200);
        expect(res.body.id).toBe('doc1');
        expect(repository.upload).toHaveBeenCalledWith(expect.objectContaining({ originalName: 'manual.pdf' }));
    });

    it('forwards a Pergamo rejection to the user', async () => {
        repository.upload.mockRejectedValue(new ExternalServiceException('Invalid mimetype', 400));

        const res = await request(app)
            .post('/api/document')
            .set('Authorization', token)
            .attach('file', Buffer.from('# md'), 'notes.md');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid mimetype');
    });

    it('returns 502 when Pergamo is down', async () => {
        repository.delete.mockRejectedValue(new ExternalServiceException('Pergamo unreachable', 502));

        const res = await request(app).delete('/api/document/doc1').set('Authorization', token);

        expect(res.status).toBe(502);
    });
});
