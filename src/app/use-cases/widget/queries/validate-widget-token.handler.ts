import { ValidateWidgetTokenQuery } from './validate-widget-token.query';
import jwt from 'jsonwebtoken';
import { config } from '@/app/config';

// El token que el cliente incrusta dura 300s: sirve para arrancar, no para toda
// la conversación. Al validarlo se devuelve uno de sesión con el que el chat
// firma cada mensaje.
const SESSION_EXPIRES_IN = '12h';

export class ValidateWidgetTokenHandler {
  async execute(
    query: ValidateWidgetTokenQuery,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<{ valid: boolean; decoded?: any; sessionToken?: string; error?: string }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded = jwt.verify(query.token, config.jwtSecret || 'default_secret_change_me') as any;

      if (decoded.type !== 'widget_token') {
        return { valid: false, error: 'Invalid token type' };
      }

      const sessionToken = jwt.sign(
        {
          widgetId: decoded.widgetId,
          allowedOrigin: decoded.allowedOrigin,
          userId: decoded.userId,
          type: 'widget_token',
        },
        config.jwtSecret || 'default_secret_change_me',
        { expiresIn: SESSION_EXPIRES_IN },
      );

      return { valid: true, decoded, sessionToken };
    } catch {
      return { valid: false, error: 'Invalid or expired token' };
    }
  }
}
