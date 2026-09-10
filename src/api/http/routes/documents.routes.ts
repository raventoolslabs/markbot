import { Router, Request, Response } from 'express';
import multer from 'multer';

import { logger } from '@/infrastructure/logging/logger';
import { documentController } from '@/api/http/controllers/document.controller';
import { authenticationMiddleware } from '@/api/http/middlewares/authentication.middleware';
import { ExternalServiceException } from '@/domain/exceptions/ExternalServiceException';

const router = Router();
// 50 MB: el tope de subida de Pergamo.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.use(authenticationMiddleware);

// Los rechazos de Pergamo (tipo no admitido, no encontrado…) llegan tal cual; lo demás es que Pergamo falla.
const sendError = (res: Response, error: unknown, context: string) => {
  logger.error(context, 'DocumentRoutes', error);

  if (error instanceof ExternalServiceException) {
    const isClientError = error.status >= 400 && error.status < 500;
    return res.status(isClientError ? error.status : 502).json({ error: error.message });
  }

  res.status(500).json({ error: 'Internal server error' });
};

/**
 * @openapi
 * /document:
 *   post:
 *     summary: Upload a document to Pergamo (PDF, ODT…) to be indexed
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
 *         description: Document stored in Pergamo
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    res.json(await documentController.uploadDocument(req.file.buffer, req.file.originalname, req.file.mimetype));
  } catch (error: unknown) {
    sendError(res, error, 'Error uploading document');
  }
});

/**
 * @openapi
 * /document/list:
 *   get:
 *     summary: List the documents stored in Pergamo
 *     tags: [Document]
 *     responses:
 *       200:
 *         description: List of documents
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    res.json(await documentController.listDocuments());
  } catch (error: unknown) {
    sendError(res, error, 'Error listing documents');
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
  } catch (error: unknown) {
    sendError(res, error, 'Error getting document');
  }
});

/**
 * @openapi
 * /document/{id}:
 *   delete:
 *     summary: Delete a document from Pergamo
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
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await documentController.deleteDocument(req.params.id);
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: unknown) {
    sendError(res, error, 'Error deleting document');
  }
});

export const documentRouter = router;
