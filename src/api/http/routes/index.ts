import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { googleRouter } from './google.routes';
import { chatRouter } from './chat.routes';
import { documentRouter } from './documents.routes';
import { authRouter } from './auth.routes';
import { apiKeyRouter } from './apiKey.routes';
import { widgetRouter } from './widget.routes';

import { usersRouter } from './users.routes';

const router = Router();

/**
 * @openapi
 * /version:
 *   get:
 *     summary: Get application version
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 */
router.get('/version', (req, res) => {
  const pkgPath = path.join(__dirname, '../../../../package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  res.json({ version: pkg.version });
});

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Check server health
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/google', googleRouter);
router.use('/chat', chatRouter);
router.use('/document', documentRouter);
router.use('/auth', authRouter);
router.use('/keys', apiKeyRouter);
router.use('/widgets', widgetRouter);
router.use('/users', usersRouter);

export const baseRouter = router;
