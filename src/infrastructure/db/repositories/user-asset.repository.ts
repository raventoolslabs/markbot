import { managerDb } from '@/infrastructure/db/client';
import { UserAsset } from '@/domain/entities/UserAsset';
import { UserAssetRepository } from '@/app/ports/repositories/user-asset.repository';
import { mapUserAssetRowToUserAsset, mapUserAssetToUserAssetRow } from '../mappers/user-asset.mapper';
import { UserAssetRow } from '../schema/UserAssetRow';

export class PgUserAssetRepository implements UserAssetRepository {
    async create(asset: UserAsset): Promise<void> {
        const row = mapUserAssetToUserAssetRow(asset);
        await managerDb.db
            .withSchema('markbot')
            .insertInto('userasset')
            .values(row)
            .execute();
    }

    async findByUserId(userId: string): Promise<UserAsset | undefined> {
        const result = await managerDb.db
            .withSchema('markbot')
            .selectFrom('userasset')
            .selectAll()
            .where('user_id', '=', userId)
            .executeTakeFirst();

        if (!result) return undefined;

        return mapUserAssetRowToUserAsset(result);
    }

    async update(userId: string, asset: Partial<UserAsset>): Promise<void> {
        const updateData: Partial<UserAssetRow> = {};
        if (asset.assetType !== undefined) updateData.asset_type = asset.assetType;
        if (asset.assetName !== undefined) updateData.asset_name = asset.assetName;
        if (asset.mimeType !== undefined) updateData.mime_type = asset.mimeType;
        if (asset.content !== undefined) updateData.content = asset.content;
        if (asset.metadata !== undefined) updateData.metadata = typeof asset.metadata === 'string' ? asset.metadata : JSON.stringify(asset.metadata);

        await managerDb.db
            .withSchema('markbot')
            .updateTable('userasset')
            .set(updateData)
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

export const userAssetRepository = new PgUserAssetRepository();
