import { GetWidgetTokenQuery } from './get-widget-token.query';
import { ApiKeyRepository } from '@/app/ports/repositories/api-key.repository';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '@/app/config';
import { InvalidTokenException } from '@/domain/exceptions/AuthExceptions';

export class GetWidgetTokenHandler {
    constructor(private apiKeyRepository: ApiKeyRepository) { }

    async execute(query: GetWidgetTokenQuery): Promise<{ token: string; expiresIn: number }> {
        const keyHash = crypto.createHash('sha256').update(query.apiKey).digest('hex');
        const keyRecord = await this.apiKeyRepository.findByKeyHash(keyHash);

        if (!keyRecord) {
            throw new Error('Unauthorized: Invalid API Key');
        }

        if (keyRecord.expirationDate && new Date() > keyRecord.expirationDate) {
            throw new Error('Unauthorized: API Key expired');
        }

        if (keyRecord.domain && query.allowedOrigin) {
            if (!query.allowedOrigin.includes(keyRecord.domain)) {
                throw new Error('Forbidden: Domain not allowed');
            }
        }

        const token = jwt.sign(
            {
                widgetId: query.widgetId,
                allowedOrigin: query.allowedOrigin,
                userId: keyRecord.userId,
                type: 'widget_token'
            },
            config.jwtSecret || 'default_secret_change_me',
            { expiresIn: '300s' }
        );

        return { token, expiresIn: 300 };
    }
}
