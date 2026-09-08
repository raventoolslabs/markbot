export interface UserAsset {
    id?: number;
    userId: string;
    assetType: string;
    assetName: string;
    mimeType: string | null;
    content: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: any;
    creationDate?: Date;
}
