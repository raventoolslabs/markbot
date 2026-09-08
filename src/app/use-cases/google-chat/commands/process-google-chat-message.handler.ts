import { ProcessGoogleChatMessageCommand } from './process-google-chat-message.command';
import { googleChatService } from '@/app/services/googleChat.service';
import { HandleChatMessageHandler } from '@/app/use-cases/chat/commands/handle-chat-message.handler';
import { logger } from '@/infrastructure/logging/logger';

export class ProcessGoogleChatMessageHandler {
    constructor(private handleChatMessageHandler: HandleChatMessageHandler) { }

    async execute(command: ProcessGoogleChatMessageCommand): Promise<void> {
        const event = command.event;
        const chatData = event.chat || {};
        let eventType = null;

        if (chatData.messagePayload) {
            eventType = 'MESSAGE';
        } else {
            eventType = chatData.type;
        }

        logger.info(`Received event type: ${eventType}`, 'ProcessGoogleChatMessageHandler');

        if (eventType === 'MESSAGE') {
            const message = chatData.messagePayload?.message || event.message;
            const space = chatData.messagePayload?.space || event.space;

            let text = message?.text || '';

            if (text.startsWith('@')) text = text.replace(/^@[^\s]+\s*/, '');

            const userName = message?.sender?.displayName;
            const userId = message?.sender?.name;
            const spaceId = space?.name;

            logger.debug(`Processing message from ${userName} (${userId}) in space ${spaceId}`, 'ProcessGoogleChatMessageHandler');

            if (!text && !chatData.messagePayload) {
                return;
            }

            const response = await this.handleChatMessageHandler.execute({
                request: {
                    text,
                    userName,
                    userId,
                    spaceId,
                    platform: 'google',
                }
            });

            if (spaceId) {
                logger.info(`Sending message back to space ${spaceId}`, 'ProcessGoogleChatMessageHandler');
                try {
                    await googleChatService.sendMessage(spaceId, response.text);
                } catch (sendError) {
                    logger.error(`Error sending message via ChatService`, 'ProcessGoogleChatMessageHandler', sendError);
                }
            }
        } else {
            logger.debug(`Unhandled event type: ${eventType}`, 'ProcessGoogleChatMessageHandler');
        }
    }
}
