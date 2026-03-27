import { UserAsset } from '@/domain/entities/UserAsset';
import { UserAssetRow } from '../schema/UserAssetRow';

export const mapUserAssetRowToUserAsset = (row: UserAssetRow): UserAsset => ({
    id: row.id,
    userId: row.user_id,
    assetType: row.asset_type,
    assetName: row.asset_name,
    mimeType: row.mime_type,
    content: row.content,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata as any),
    creationDate: row.creation_date,
});

export const mapUserAssetToUserAssetRow = (asset: UserAsset): UserAssetRow => ({
    user_id: asset.userId,
    asset_type: asset.assetType,
    asset_name: asset.assetName,
    mime_type: asset.mimeType,
    content: asset.content,
    metadata: typeof asset.metadata === 'string' ? asset.metadata : JSON.stringify(asset.metadata || {}),
});
