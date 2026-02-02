import { Router } from 'express';
import { googleAuthMiddleware } from '@/api/http/middlewares/google-auth.middleware';
import { googleChatController } from '@/api/http/controllers/google-chat.controller';

const router = Router();

/**
 * @openapi
 * /google/message:
 *   post:
 *     summary: Google Chat Webhook (Only for Google Chat Requests)
 *     tags: [Google]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: MESSAGE
 *               message:
 *                 type: object
 *                 properties:
 *                   text:
 *                     type: string
 *                   sender:
 *                     type: object
 *                     properties:
 *                       displayName:
 *                         type: string
 *                       name:
 *                         type: string
 *               space:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 */
router.get('/auth', googleChatController.handleAuth);

router.post('/message', googleAuthMiddleware, googleChatController.handleMessage);

/**
 * @openapi
 * /google/oauth2/callback:
 *   get:
 *     summary: Google OAuth 2.0 Callback
 *     tags: [Google]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter for CSRF protection
 *     responses:
 *       200:
 *         description: Authentication successful
 *       400:
 *         description: Authentication failed
 */
router.get('/oauth2/callback', googleChatController.handleCallback);

export const googleRouter = router;
