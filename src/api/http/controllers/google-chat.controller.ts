import { Request, Response } from 'express';
import { logger } from '@/infrastructure/logging/logger';

import { GetGoogleChatAuthUrlHandler } from '@/app/use-cases/google-chat/queries/get-google-chat-auth-url.handler';
import { HandleGoogleChatCallbackHandler } from '@/app/use-cases/google-chat/commands/handle-google-chat-callback.handler';
import { ProcessGoogleChatMessageHandler } from '@/app/use-cases/google-chat/commands/process-google-chat-message.handler';

import { HandleChatMessageHandler } from '@/app/use-cases/chat/commands/handle-chat-message.handler';
import { SearchDocumentsHandler } from '@/app/use-cases/document/queries/search-documents.handler';
import { pergamoDocumentRepository } from '@/infrastructure/pergamo/pergamo-document.repository';

const searchDocumentsHandler = new SearchDocumentsHandler(pergamoDocumentRepository);
const handleChatMessageHandler = new HandleChatMessageHandler(searchDocumentsHandler);

const getGoogleChatAuthUrlHandler = new GetGoogleChatAuthUrlHandler();
const handleGoogleChatCallbackHandler = new HandleGoogleChatCallbackHandler();
const processGoogleChatMessageHandler = new ProcessGoogleChatMessageHandler(handleChatMessageHandler);

export class GoogleChatController {
  async handleAuth(req: Request, res: Response) {
    const url = await getGoogleChatAuthUrlHandler.execute({});
    res.redirect(url);
  }

  async handleCallback(req: Request, res: Response) {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      res.status(400).send('Missing code');
      return;
    }

    try {
      await handleGoogleChatCallbackHandler.execute({ code });
      logger.info('OAuth callback successful', 'GoogleChatController');
      res.send('Authentication successful! You can now close this window.');
    } catch (error) {
      logger.error('Error getting token via callback', 'GoogleChatController', error);
      res.status(500).send('Authentication failed');
    }
  }

  async handleMessage(req: Request, res: Response) {
    try {
      const event = req.body;
      await processGoogleChatMessageHandler.execute({ event });
      res.json({});
    } catch (error) {
      logger.error('Error handling message', 'GoogleChatController', error);
      res.json({});
    }
  }
}

export const googleChatController = new GoogleChatController();
