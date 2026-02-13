import { Kysely } from 'kysely';
import { Database } from '../schema/Database';
import { ApiKey, CreateApiKeyDTO } from '../../../domain/entities/ApiKey';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export class ApiKeyRepository {
    constructor(private db: Kysely<Database>) { }

    async create(data: CreateApiKeyDTO): Promise<{ apiKey: ApiKey; keySecret: string }> {
        const keySecret = 'mk_' + crypto.randomBytes(24).toString('hex');
        const keyHash = crypto.createHash('sha256').update(keySecret).digest('hex');
        const prefix = keySecret.substring(0, 10);
        const id = uuidv4();

        const row = {
            id,
            user_id: data.userId,
            key_hash: keyHash,
            name: data.name,
            prefix: prefix,
            expiration_date: data.expirationDate || null,
            domain: data.domain || null,
            created_at: new Date(),
        };

        await this.db
            .withSchema('markbot')
            .insertInto('api_key')
            .values(row)
            .execute();

        return {
            apiKey: {
                id: row.id,
                userId: row.user_id,
                name: row.name,
                prefix: row.prefix,
                expirationDate: row.expiration_date,
                domain: row.domain,
                createdAt: row.created_at,
            },
            keySecret,
        };
    }

    async findByUserId(userId: string): Promise<ApiKey[]> {
        const rows = await this.db
            .withSchema('markbot')
            .selectFrom('api_key')
            .selectAll()
            .where('user_id', '=', userId)
            .orderBy('created_at', 'desc')
            .execute();

        return rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            prefix: row.prefix,
            expirationDate: row.expiration_date,
            domain: row.domain,
            createdAt: row.created_at,
        }));
    }

    async delete(id: string, userId: string): Promise<boolean> {
        const result = await this.db
            .withSchema('markbot')
            .deleteFrom('api_key')
            .where('id', '=', id)
            .where('user_id', '=', userId)
            .executeTakeFirst();

        return result.numDeletedRows > 0n;
    }

    async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
        const row = await this.db
            .withSchema('markbot')
            .selectFrom('api_key')
            .selectAll()
            .where('key_hash', '=', keyHash)
            .executeTakeFirst();

        if (!row) return null;

        return {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            prefix: row.prefix,
            expirationDate: row.expiration_date,
            domain: row.domain,
            createdAt: row.created_at,
        };
    }
}
