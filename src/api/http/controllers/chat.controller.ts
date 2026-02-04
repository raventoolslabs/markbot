import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/ollama';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { documentController } from '@/api/http/controllers/document.controller';
import { logger } from '@/infrastructure/logging/logger';
import { config } from '@/app/config';

import { ChatMessageRequestDto } from '@/api/http/types/ChatMessageRequestDto';
import { ChatMessageResponseDto } from '@/api/http/types/ChatMessageResponseDto';
import { SearchResultDto } from '@/api/http/types/SearchResultDto';
import { DocumentAssetDto } from '@/api/http/types/DocumentAssetDto';

export class ChatController {
  private commands: Record<string, (context: ChatMessageRequestDto) => ChatMessageResponseDto> = {};

  constructor() {
    this.registerCommands();
  }

  private registerCommands() {
    this.commands = {
      '/help': this.getHelpResponse.bind(this),
      help: this.getHelpResponse.bind(this),
      '/ping': this.getPingResponse.bind(this),
      ping: this.getPingResponse.bind(this),
      '/info': (context) => this.getInfoResponse(context.platform),
    };
  }

  /**
   * Process incoming messages and generate appropriate responses
   * @param context - The message context containing text and metadata
   * @returns A formatted response object
   */
  async handleMessage(context: ChatMessageRequestDto): Promise<ChatMessageResponseDto> {
    const { text } = context;
    const lowerText = text.toLowerCase().trim();

    const commandHandler = this.findCommandHandler(lowerText);

    if (commandHandler) {
      return commandHandler(context);
    }

    return this.handleSemanticSearch(context);
  }

  private findCommandHandler(text: string) {
    // Check for exact matches or startsWith for commands that accept args (if any)
    // Current logic mainly checks startsWith.
    // Order matters if we had overlapping commands, but here they are distinct enough.
    const keys = Object.keys(this.commands);

    for (const key of keys) {
      if (text.startsWith(key)) {
        return this.commands[key];
      }
    }

    return null;
  }

  /**
   * Performs semantic search and generates an AI response
   */
  private async handleSemanticSearch(context: ChatMessageRequestDto): Promise<ChatMessageResponseDto> {
    const { text, userName, platform } = context;

    try {
      logger.info(`Searching context for: "${text}"`, 'MessageHandler');
      const searchResults = await documentController.search(text, config.vector.queryLimit);

      // Extract both content and assets from search results
      const contextData = searchResults.map((res: SearchResultDto) => ({
        content: res.content,
        assets: res.assets || [],
      }));

      const contextStrings = contextData.map((d) => d.content);

      // Collect all images from all chunks
      const allImages = contextData.flatMap((d) => d.assets.filter((a: DocumentAssetDto) => a.asset_type === 'image'));

      if (contextStrings.length > 0) {
        logger.info(
          `Found ${contextStrings.length} relevant chunks with ${allImages.length} images.`,
          'MessageHandler',
        );
        const aiResponse = await this.generateResponse(text, contextStrings);

        const response: ChatMessageResponseDto = {
          text: aiResponse,
          metadata: {
            source: 'vector-search',
            resultsCount: contextStrings.length,
            imagesCount: allImages.length,
          },
        };

        // Include images if any were found
        if (allImages.length > 0) {
          response.images = allImages.map((img: DocumentAssetDto) => ({
            name: img.asset_name,
            mimeType: img.mime_type || 'application/octet-stream',
            data: img.content, // base64
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
          source: 'echo-fallback',
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

  private getPingResponse(): ChatMessageResponseDto {
    return {
      text: '🏓 Pong! El bot está funcionando correctamente.',
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
        - El contexto puede contener referencias a imágenes en el formato \`![texto alternativo][nombre_imagen]\` o \`![][nombre_imagen]\`.
        - CUANDO uses información de un fragmento que tiene una imagen, DEBES incluir la imagen visualmente en tu respuesta.
        - Para incluir la imagen, usa EXACTAMENTE este formato Markdown: \`![nombre_imagen](nombre_imagen)\`.
        - Inserta la imagen JUSTO DESPUÉS del párrafo relevante, para no perder el contexto.
        - NO inventes nombres de imágenes, usa solo las que aparecen en el contexto como \`[nombre_imagen]\`.
        
        Contexto:
        ${context.join('\n---\n')}
      `;

      let llm;
      // Use config values
      const provider = config.chat.provider;
      const temperature = config.chat.temperature;
      const modelName = config.chat.modelName;

      if (provider === 'ollama') {
        llm = new ChatOllama({
          baseUrl: config.chat.ollamaBaseUrl,
          model: modelName,
          temperature: temperature,
        });
      } else {
        llm = new ChatOpenAI({
          apiKey: config.chat.apiKey,
          modelName: modelName,
          temperature: temperature,
        });
      }

      const response = await llm.invoke([new SystemMessage(systemPrompt), new HumanMessage(query)]);

      return response.content as string;
    } catch (error) {
      logger.error('Error generating AI response', 'AIService', error);
      throw new Error('No pude generar una respuesta inteligente en este momento.');
    }
  }
}

// Export singleton instance
export const chatController = new ChatController();
