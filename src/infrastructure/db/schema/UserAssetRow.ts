export interface UserAssetRow {
    id?: number;
    user_id: string;
    asset_type: string;
    asset_name: string;
    mime_type: string | null;
    content: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: any;
    creation_date?: Date;
}
