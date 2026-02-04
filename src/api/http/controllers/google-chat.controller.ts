import { Request, Response } from 'express';
import { googleChatService } from '@/infrastructure/services/googleChat.service';
import { logger } from '@/infrastructure/logging/logger';
import { chatController } from '@/api/http/controllers/chat.controller';

export class GoogleChatController {
  handleAuth(req: Request, res: Response) {
    const url = googleChatService.getAuthUrl();
    res.redirect(url);
  }

  async handleCallback(req: Request, res: Response) {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).send('Missing code');
    }

    try {
      await googleChatService.getToken(code);
      logger.info('OAuth callback successful', 'GoogleChatController');
      res.send('Authentication successful! You can now close this window.');
    } catch (error) {
      logger.error('Error getting token via callback', 'GoogleChatController', error);
      res.status(500).send('Authentication failed');
    }
  }

  async handleMessage(req: Request, res: Response) {
    const event = req.body;

    const chatData = event.chat || {};
    let eventType = null;

    if (chatData.messagePayload) {
      eventType = 'MESSAGE';
    } else {
      eventType = chatData.type;
    }

    logger.info(`Received event type: ${eventType}`, 'GoogleChatController');

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

        logger.debug(`Processing message from ${userName} (${userId}) in space ${spaceId}`, 'GoogleChatController');

        if (!text && !chatData.messagePayload) {
          return res.json({});
        }

        // Use the centralized chat controller
        const response = await chatController.handleMessage({
          text,
          userName,
          userId,
          spaceId,
          platform: 'google',
        });

        if (spaceId) {
          logger.info(`Sending message back to space ${spaceId}`, 'GoogleChatController');

          try {
            await googleChatService.sendMessage(spaceId, response.text);
          } catch (sendError) {
            logger.error(`Error sending message via ChatService`, 'GoogleChatController', sendError);
          }
        }

        res.json({});
      } catch (error) {
        logger.error('Error processing Google message', 'GoogleChatController', error);
        res.json({});
      }
    } else {
      logger.debug(`Unhandled event type: ${eventType}`, 'GoogleChatController');
      res.json({});
    }
  }
}

export const googleChatController = new GoogleChatController();
