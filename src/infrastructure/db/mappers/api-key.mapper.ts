import { ApiKey } from '@/domain/entities/ApiKey';
import { ApiKeyRow } from '../schema/ApiKeyRow';

export const mapApiKeyRowToApiKey = (row: ApiKeyRow): ApiKey => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    prefix: row.prefix,
    expirationDate: row.expiration_date,
    domain: row.domain,
    createdAt: row.created_at,
});
