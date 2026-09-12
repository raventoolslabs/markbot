import { ChatMessageRequestDto } from '@/api/http/types/ChatMessageRequestDto';
import { ChatMessageResponseDto } from '@/api/http/types/ChatMessageResponseDto';

import { HandleChatMessageHandler } from '@/app/use-cases/chat/commands/handle-chat-message.handler';
import { SearchDocumentsHandler } from '@/app/use-cases/document/queries/search-documents.handler';
import { pergamoDocumentRepository } from '@/infrastructure/pergamo/pergamo-document.repository';

const searchDocumentsHandler = new SearchDocumentsHandler(pergamoDocumentRepository);
const handleChatMessageHandler = new HandleChatMessageHandler(searchDocumentsHandler);

export class ChatController {
  constructor() { }

  async handleMessage(context: ChatMessageRequestDto): Promise<ChatMessageResponseDto> {
    return await handleChatMessageHandler.execute({ request: context });
  }

  formatErrorResponse(error: Error): ChatMessageResponseDto {
    return {
      text: `❌ Error al procesar el mensaje: ${error.message}`,
      metadata: {
        error: true,
        errorMessage: error.message,
      },
    };
  }
}

export const chatController = new ChatController();
