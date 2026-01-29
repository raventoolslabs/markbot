import { aiService } from '../ai/aiService';
import { vectorService } from '../vector/service';
import { logger } from '../../util/logger';

export interface MessageContext {
  text: string;
  userId?: string;
  userName?: string;
  spaceId?: string;
  platform?: 'google' | 'slack' | 'teams' | 'generic';
}

export interface MessageResponse {
  text: string;
  cards?: any[];
  metadata?: Record<string, any>;
}

export class MessageHandler {
  /**
   * Process incoming messages and generate appropriate responses
   * @param context - The message context containing text and metadata
   * @returns A formatted response object
   */
  async handleMessage(context: MessageContext): Promise<MessageResponse> {
    const { text, userName, platform } = context;

    // Basic message processing logic
    const lowerText = text.toLowerCase().trim();

    // Command handling
    if (lowerText.startsWith('/help') || lowerText === 'help') {
      return this.getHelpResponse();
    }

    if (lowerText.startsWith('/ping') || lowerText === 'ping') {
      return {
        text: '🏓 Pong! El bot está funcionando correctamente.',
      };
    }

    if (lowerText.startsWith('/info')) {
      return this.getInfoResponse(platform);
    }

    // Default: Perform semantic search and generate AI response
    try {
      logger.info(`Searching context for: "${text}"`, 'MessageHandler');
      const searchResults = await vectorService.search(text, 3);

      const contextStrings = searchResults.map((res: any) => res.content);

      if (contextStrings.length > 0) {
        logger.info(`Found ${contextStrings.length} relevant chunks. Generating AI response...`, 'MessageHandler');
        const aiResponse = await aiService.generateResponse(text, contextStrings);
        return {
          text: aiResponse,
          metadata: {
            source: 'vector-search',
            resultsCount: contextStrings.length,
          }
        };
      }

      // If no context found, fallback to default or generic AI response
      const greeting = userName ? `Hola ${userName}` : 'Hola';
      return {
        text: `${greeting}, no encontré información específica en mis documentos sobre eso, pero recibí tu mensaje: "${text}"`,
        metadata: {
          processedAt: new Date().toISOString(),
          platform: platform || 'unknown',
          source: 'echo-fallback'
        },
      };
    } catch (error) {
      logger.error('Error in message handler flow', 'MessageHandler', error);
      return {
        text: 'Lo siento, tuve un problema al consultar mi base de datos de conocimientos.',
      };
    }
  }

  /**
   * Generate help response
   */
  private getHelpResponse(): MessageResponse {
    return {
      text: `📚 *Comandos disponibles:*
• /help - Muestra esta ayuda
• /ping - Verifica que el bot está activo
• /info - Información sobre el bot
• Cualquier otro mensaje - El bot responderá con un eco`,
    };
  }

  /**
   * Generate info response
   */
  private getInfoResponse(platform?: string): MessageResponse {
    return {
      text: `ℹ️ *Información del Bot:*
• Nombre: MarkBot
• Versión: 1.0.0
• Plataforma: ${platform || 'Desconocida'}
• Estado: Activo ✅`,
    };
  }

  /**
   * Format error response
   */
  formatErrorResponse(error: Error): MessageResponse {
    return {
      text: `❌ Error al procesar el mensaje: ${error.message}`,
      metadata: {
        error: true,
        errorMessage: error.message,
      },
    };
  }
}

// Export singleton instance
export const messageHandler = new MessageHandler();
