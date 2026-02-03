import { DocumentRow } from './DocumentRow';
import { DocumentChunkRow } from './DocumentChunkRow';
import { DocumentChunkAssetRow } from './DocumentChunkAssetRow';

export interface Database {
    document: DocumentRow;
    documentchunk: DocumentChunkRow;
    documentchunkasset: DocumentChunkAssetRow;
}
