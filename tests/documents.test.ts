import request from 'supertest';
import { app } from '../src/app';
import { documentController } from '../src/api/http/controllers/document.controller';

jest.mock('../src/api/http/controllers/document.controller');

describe('Documents Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/document', () => {
        it('should return 400 if no file is uploaded', async () => {
            const res = await request(app)
                .post('/api/document');

            expect(res.status).toBe(400);
            expect(res.text).toBe('No file uploaded');
        });

        it('should process file upload successfully', async () => {
            (documentController.processFile as jest.Mock).mockResolvedValue({ id: 'doc123' });

            const res = await request(app)
                .post('/api/document')
                .attach('file', Buffer.from('test content'), 'test.pdf');

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('File processed successfully');
        });
    });

    describe('GET /api/document/list', () => {
        it('should list documents', async () => {
            (documentController.listDocuments as jest.Mock).mockResolvedValue([{ id: 'doc123' }]);

            const res = await request(app).get('/api/document/list');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('GET /api/document/:id', () => {
        it('should get document details', async () => {
            (documentController.getDocument as jest.Mock).mockResolvedValue({ id: 'doc123' });

            const res = await request(app).get('/api/document/doc123');

            expect(res.status).toBe(200);
            expect(res.body.id).toBe('doc123');
        });

        it('should return 404 if not found', async () => {
            (documentController.getDocument as jest.Mock).mockResolvedValue(null);

            const res = await request(app).get('/api/document/doc123');

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/document/:id', () => {
        it('should delete a document', async () => {
            (documentController.deleteDocument as jest.Mock).mockResolvedValue(true);

            const res = await request(app).delete('/api/document/doc123');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
