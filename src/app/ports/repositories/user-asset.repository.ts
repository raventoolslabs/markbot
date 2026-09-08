import { UserAsset } from '@/domain/entities/UserAsset';

export interface UserAssetRepository {
    create(asset: UserAsset): Promise<void>;
    findByUserId(userId: string): Promise<UserAsset | undefined>;
    update(userId: string, asset: Partial<UserAsset>): Promise<void>;
    deleteByUserId(userId: string): Promise<void>;
}
