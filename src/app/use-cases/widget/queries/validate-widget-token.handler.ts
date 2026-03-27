import { ValidateWidgetTokenQuery } from './validate-widget-token.query';
import jwt from 'jsonwebtoken';
import { config } from '@/app/config';

export class ValidateWidgetTokenHandler {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async execute(query: ValidateWidgetTokenQuery): Promise<{ valid: boolean; decoded?: any; error?: string }> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const decoded = jwt.verify(query.token, config.jwtSecret || 'default_secret_change_me') as any;
            if (decoded.type !== 'widget_token') {
                return { valid: false, error: 'Invalid token type' };
            }
            return { valid: true, decoded };
        } catch (err) {
            return { valid: false, error: 'Invalid or expired token' };
        }
    }
}
