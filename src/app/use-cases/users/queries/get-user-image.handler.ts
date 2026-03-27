import { GetUserImageQuery } from './get-user-image.query';
import { UserAssetRepository } from '@/app/ports/repositories/user-asset.repository';

export class GetUserImageHandler {
    constructor(private userAssetRepository: UserAssetRepository) { }

    async execute(query: GetUserImageQuery): Promise<{ content: string; mimeType: string } | null> {
        const asset = await this.userAssetRepository.findByUserId(query.userId);

        if (!asset || !asset.content) {
            return null;
        }

        return {
            content: asset.content,
            mimeType: asset.mimeType || 'image/jpeg'
        };
    }
}
