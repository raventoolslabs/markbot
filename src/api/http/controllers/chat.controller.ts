import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { documentController } from '@/api/http/controllers/document.controller';
import { logger } from '@/infrastructure/logging/logger';
import { config } from '@/app/config';

import { ChatMessageRequestDto } from '@/api/http/types/ChatMessageRequestDto';
import { ChatMessageResponseDto } from '@/api/http/types/ChatMessageResponseDto';

export class ChatController {

  private model: ChatOpenAI;

  constructor() {
    this.model = new ChatOpenAI({
      openAIApiKey: config.openaiApiKey,
      modelName: 'gpt-4o', // Or gpt-3.5-turbo
      temperature: 0.7,
    });
  }

  /**
   * Process incoming messages and generate appropriate responses
   * @param context - The message context containing text and metadata
   * @returns A formatted response object
   */
  async handleMessage(context: ChatMessageRequestDto): Promise<ChatMessageResponseDto> {
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
      const searchResults = await documentController.search(text, 3);

      // Extract both content and assets from search results
      const contextData = searchResults.map((res: any) => ({
        content: res.content,
        assets: res.assets || []
      }));

      const contextStrings = contextData.map(d => d.content);

      // Collect all images from all chunks
      const allImages = contextData.flatMap(d =>
        d.assets.filter((a: any) => a.asset_type === 'image')
      );

      if (contextStrings.length > 0) {
        logger.info(
          `Found ${contextStrings.length} relevant chunks with ${allImages.length} images.`,
          'MessageHandler'
        );
        const aiResponse = await this.generateResponse(text, contextStrings);

        const response: ChatMessageResponseDto = {
          text: aiResponse,
          metadata: {
            source: 'vector-search',
            resultsCount: contextStrings.length,
            imagesCount: allImages.length
          }
        };

        // Include images if any were found
        if (allImages.length > 0) {
          response.images = allImages.map((img: any) => ({
            name: img.asset_name,
            mimeType: img.mime_type,
            data: img.content // base64
          }));
        }

        return response;
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
  private getHelpResponse(): ChatMessageResponseDto {
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
  private getInfoResponse(platform?: string): ChatMessageResponseDto {
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
  formatErrorResponse(error: Error): ChatMessageResponseDto {
    return {
      text: `❌ Error al procesar el mensaje: ${error.message}`,
      metadata: {
        error: true,
        errorMessage: error.message,
      },
    };
  }

  async generateResponse(query: string, context: string[]): Promise<string> {
    try {
      const systemPrompt = `
        Eres MarkBot, un asistente inteligente y útil.
        Utiliza el siguiente contexto recuperado para responder a la pregunta del usuario.
        Si la información no está en el contexto, dí que no lo sabes basándote en los documentos, pero intenta ser de ayuda.
        
        IMPORTANTE: 
        - Formatea tu respuesta usando Markdown para mejor legibilidad.
        - Usa **negrita** para términos importantes y listas para enumeraciones.
        - El contexto puede contener referencias a imágenes en el formato \`![][nombre_imagen]\`.
        - CUANDO uses información de un fragmento que tiene una imagen, DEBES incluir la imagen visualmente en tu respuesta.
        - Para incluir la imagen, usa EXACTAMENTE este formato Markdown: \`![nombre_imagen](nombre_imagen)\`.
        - Inserta la imagen JUSTO DESPUÉS del párrafo relevante, para no perder el contexto.
        - NO inventes nombres de imágenes, usa solo las que aparecen en el contexto como \`![][...]\`.
        
        Contexto:
        ${context.join('\n---\n')}
      `;

      const response = await this.model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(query),
      ]);

      return response.content as string;
    } catch (error) {
      logger.error('Error generating AI response', 'AIService', error);
      throw new Error('No pude generar una respuesta inteligente en este momento.');
    }
  }
}

// Export singleton instance
export const chatController = new ChatController();
