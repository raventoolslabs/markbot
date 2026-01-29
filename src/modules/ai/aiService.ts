import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config } from '../../config';
import { logger } from '../../util/logger';

export class AIService {
    private model: ChatOpenAI;

    constructor() {

        console.log(config.openaiApiKey);
        this.model = new ChatOpenAI({
            openAIApiKey: config.openaiApiKey,
            modelName: 'gpt-4o', // Or gpt-3.5-turbo
            temperature: 0.7,
        });
    }

    async generateResponse(query: string, context: string[]): Promise<string> {
        try {
            const systemPrompt = `
        Eres MarkBot, un asistente inteligente y útil.
        Utiliza el siguiente contexto recuperado para responder a la pregunta del usuario.
        Si la información no está en el contexto, dí que no lo sabes basándote en los documentos, pero intenta ser de ayuda.
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

export const aiService = new AIService();
