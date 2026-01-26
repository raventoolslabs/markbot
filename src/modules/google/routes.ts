import { Router, Request, Response } from 'express';
import { verifyGoogleChatToken } from './auth';
import { messageHandler } from '../chat/messageHandler';
import { chatService } from './chatService';
import { logger } from '../../util/logger';

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
router.get('/auth', (req, res) => {
  const url = chatService.getAuthUrl();
  res.redirect(url);
});

router.post('/message', verifyGoogleChatToken, async (req: Request, res: Response) => {
  const event = req.body;

  const chatData = event.chat || {};
  let eventType = null;

  if (chatData.messagePayload) {
    eventType = 'MESSAGE';
  } else {
    eventType = chatData.type;
  }

  logger.info(`Received event type: ${eventType}`, 'GoogleRoutes');

  if (eventType === 'MESSAGE') {
    try {
      // Extract message data focusing on messagePayload if available
      const message = chatData.messagePayload?.message || event.message;
      const space = chatData.messagePayload?.space || event.space;

      let text = message?.text || '';

      if (text.startsWith('@')) text = text.replace(/^@[^\s]+\s*/, '');

      const userName = message?.sender?.displayName;
      const userId = message?.sender?.name;
      const spaceId = space?.name;

      logger.debug(
        `Processing message from ${userName} (${userId}) in space ${spaceId}`,
        'GoogleRoutes',
      );

      if (!text && !chatData.messagePayload) {
        return res.json({});
      }

      // Use the centralized message handler
      const response = await messageHandler.handleMessage({
        text,
        userName,
        userId,
        spaceId,
        platform: 'google',
      });

      if (spaceId) {
        logger.info(`Sending message back to space ${spaceId}`, 'GoogleRoutes');
        try {
          await chatService.sendMessage(spaceId, response.text);
        } catch (sendError) {
          logger.error(`Error sending message via ChatService`, 'GoogleRoutes', sendError);
        }
      }

      res.json({});
    } catch (error) {
      logger.error('Error processing Google message', 'GoogleRoutes', error);
      res.json({});
    }
  } else {
    logger.debug(`Unhandled event type: ${eventType}`, 'GoogleRoutes');
    res.json({});
  }
});

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
router.get('/oauth2/callback', async (req, res) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).send('Missing code');
  }

  try {
    await chatService.getToken(code);
    logger.info('OAuth callback successful', 'GoogleRoutes');
    res.send('Authentication successful! You can now close this window.');
  } catch (error) {
    logger.error('Error getting token via callback', 'GoogleRoutes', error);
    res.status(500).send('Authentication failed');
  }
});

export const googleRouter = router;
