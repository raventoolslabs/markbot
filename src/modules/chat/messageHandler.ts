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

    // Default echo response with enhancement
    const greeting = userName ? `Hola ${userName}` : 'Hola';
    return {
      text: `${greeting}, recibí tu mensaje: "${text}"`,
      metadata: {
        processedAt: new Date().toISOString(),
        platform: platform || 'unknown',
      },
    };
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
