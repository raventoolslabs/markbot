import { Router, Request, Response } from 'express';
import multer from 'multer';
import { vectorService } from './service';
import { logger } from '../../util/logger';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @openapi
 * /vector/upload:
 *   post:
 *     summary: Upload a PDF or Markdown file to vectorize
 *     tags: [Vector]
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
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    try {
        const result = await vectorService.processFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );
        res.json({ message: 'File processed successfully', ...result });
    } catch (error: any) {
        logger.error('Error processing file upload', 'VectorRoutes', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @openapi
 * /vector/search:
 *   post:
 *     summary: Semantic search on vectorized documents
 *     tags: [Vector]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *               limit:
 *                 type: number
 *                 default: 5
 *     responses:
 *       200:
 *         description: Search results
 */
router.post('/search', async (req: Request, res: Response) => {
    const { query, limit } = req.body;

    if (!query) {
        return res.status(400).send('Query is required');
    }

    try {
        const results = await vectorService.search(query, limit);
        res.json(results);
    } catch (error: any) {
        logger.error('Error searching vector database', 'VectorRoutes', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @openapi
 * /vector/documents:
 *   get:
 *     summary: List all uploaded documents
 *     tags: [Vector]
 *     responses:
 *       200:
 *         description: List of documents
 */
router.get('/documents', async (req: Request, res: Response) => {
    try {
        const documents = await vectorService.listDocuments();
        res.json(documents);
    } catch (error: any) {
        logger.error('Error listing documents', 'VectorRoutes', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @openapi
 * /vector/documents/{id}:
 *   get:
 *     summary: Get document details and chunks
 *     tags: [Vector]
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
router.get('/documents/:id', async (req: Request, res: Response) => {
    try {
        const document = await vectorService.getDocument(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json(document);
    } catch (error: any) {
        logger.error('Error getting document', 'VectorRoutes', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @openapi
 * /vector/documents/{id}:
 *   delete:
 *     summary: Delete a document and its chunks
 *     tags: [Vector]
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
router.delete('/documents/:id', async (req: Request, res: Response) => {
    try {
        await vectorService.deleteDocument(req.params.id);
        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error: any) {
        logger.error(`Error deleting document: ${error.message}`, 'VectorRoutes');
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

export const vectorRouter = router;
