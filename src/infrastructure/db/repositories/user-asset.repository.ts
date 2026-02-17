import { managerDb } from '@/infrastructure/db/client';
import { UserAssetRow } from '@/infrastructure/db/schema/UserAssetRow';

export class UserAssetRepository {
    async create(asset: UserAssetRow): Promise<void> {
        await managerDb.db
            .withSchema('markbot')
            .insertInto('userasset')
            .values({
                user_id: asset.user_id,
                asset_type: asset.asset_type,
                asset_name: asset.asset_name,
                mime_type: asset.mime_type || null,
                content: asset.content,
                metadata: JSON.stringify(asset.metadata || {}),
            })
            .execute();
    }

    async findByUserId(userId: string): Promise<UserAssetRow | undefined> {
        const result = await managerDb.db
            .withSchema('markbot')
            .selectFrom('userasset')
            .selectAll()
            .where('user_id', '=', userId)
            .executeTakeFirst();

        if (!result) return undefined;

        return {
            ...result,
            id: Number(result.id),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            metadata: typeof result.metadata === 'string' ? JSON.parse(result.metadata) : (result.metadata as any),
        };
    }

    async update(userId: string, asset: Partial<UserAssetRow>): Promise<void> {
        await managerDb.db
            .withSchema('markbot')
            .updateTable('userasset')
            .set({
                ...asset,
                metadata: asset.metadata ? JSON.stringify(asset.metadata) : undefined,
            })
            .where('user_id', '=', userId)
            .execute();
    }

    async deleteByUserId(userId: string): Promise<void> {
        await managerDb.db
            .withSchema('markbot')
            .deleteFrom('userasset')
            .where('user_id', '=', userId)
            .execute();
    }
}

export const userAssetRepository = new UserAssetRepository();
