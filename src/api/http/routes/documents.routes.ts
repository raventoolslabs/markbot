import { Router, Request, Response } from 'express';
import multer from 'multer';

import { logger } from '@/infrastructure/logging/logger';
import { documentController } from '@/api/http/controllers/document.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @openapi
 * /document:
 *   post:
 *     summary: Upload a PDF or Markdown file to vectorize
 *     tags: [Document]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File processed successfully
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    try {
        const result = await documentController.processFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );
        res.json({ message: 'File processed successfully', ...result });
    } catch (error: any) {
        logger.error('Error processing file upload', 'DocumentRoutes', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @openapi
 * /document/list:
 *   get:
 *     summary: List all uploaded documents
 *     tags: [Document]
 *     responses:
 *       200:
 *         description: List of documents
 */
router.get('/list', async (req: Request, res: Response) => {
    try {
        const documents = await documentController.listDocuments();
        res.json(documents);
    } catch (error: any) {
        logger.error('Error listing documents', 'DocumentRoutes', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @openapi
 * /document/{id}:
 *   get:
 *     summary: Get document details and chunks
 *     tags: [Document]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document details
 *       404:
 *         description: Document not found
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const document = await documentController.getDocument(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json(document);
    } catch (error: any) {
        logger.error('Error getting document', 'DocumentRoutes', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @openapi
 * /document/{id}:
 *   delete:
 *     summary: Delete a document and its chunks
 *     tags: [Document]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await documentController.deleteDocument(req.params.id);
        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error: any) {
        logger.error(`Error deleting document: ${error.message}`, 'DocumentRoutes');
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

export const documentRouter = router;
