import { HandleChatMessageCommand } from './handle-chat-message.command';
import { ChatMessageResponseDto } from '@/api/http/types/ChatMessageResponseDto';
import { SearchDocumentsHandler } from '@/app/use-cases/document/queries/search-documents.handler';
import { logger } from '@/infrastructure/logging/logger';
import { config } from '@/app/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/ollama';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export class HandleChatMessageHandler {
    constructor(private searchDocumentsHandler: SearchDocumentsHandler) { }

    async execute(command: HandleChatMessageCommand): Promise<ChatMessageResponseDto> {
        const { text, platform } = command.request;
        const lowerText = text.toLowerCase().trim();

        if (lowerText.startsWith('/help') || lowerText.startsWith('help')) {
            return this.getHelpResponse();
        }
        if (lowerText.startsWith('/ping') || lowerText.startsWith('ping')) {
            return this.getPingResponse();
        }
        if (lowerText.startsWith('/info')) {
            return this.getInfoResponse(platform);
        }

        return this.handleSemanticSearch(command.request);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async handleSemanticSearch(context: any): Promise<ChatMessageResponseDto> {
        const { text, userName, platform } = context;

        try {
            logger.info(`Searching context for: "${text}"`, 'MessageHandler');
            const searchResults = await this.searchDocumentsHandler.execute({ query: text, limit: config.vector.queryLimit });

            const contextStrings = searchResults.map(
                (result) => `[Fuente: ${result.documentName} | Sección: ${result.section}]\n${result.content}`,
            );

            if (contextStrings.length > 0) {
                logger.info(`Found ${contextStrings.length} relevant chunks.`, 'MessageHandler');

                const aiResponse = await this.generateResponse(text, contextStrings);

                const sourcesList = Array.from(new Set(searchResults.map(
                    (result) => JSON.stringify({ document: result.documentName, section: result.section }),
                ))).map((source) => JSON.parse(source));

                return {
                    text: aiResponse,
                    metadata: {
                        source: 'vector-search',
                        resultsCount: contextStrings.length,
                        sources: sourcesList,
                    },
                };
            }

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
            // Si Pergamo no responde se dice, en vez de contestar como si el fondo estuviera vacío.
            logger.error('Error in message handler flow', 'MessageHandler', error);
            return {
                text: 'Lo siento, tuve un problema al consultar mi base de datos de conocimientos.',
            };
        }
    }

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

    private getInfoResponse(platform?: string): ChatMessageResponseDto {
        return {
            text: `ℹ️ *Información del Bot:*
• Nombre: ${config.botName}
• Versión: 1.0.0
• Plataforma: ${platform || 'Desconocida'}
• Estado: Activo ✅`,
        };
    }

    private async generateResponse(query: string, context: string[]): Promise<string> {
        try {
            const systemPrompt = `
                Eres ${config.botName}, un asistente inteligente y útil.
                Utiliza el siguiente contexto recuperado para responder a la pregunta del usuario.
                Si la información no está en el contexto, dí que no lo sabes basándote en los documentos, pero intenta ser de ayuda.

                IMPORTANTE:
                - Formatea tu respuesta usando Markdown para mejor legibilidad.
                - Usa **negrita** para términos importantes y listas para enumeraciones.
                - Céntrate únicamente en responder la pregunta sin añadir ningún texto sobre qué fuentes consultaste.

                Contexto:
                ${context.join('\n---\n')}
            `;

            let llm;
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
