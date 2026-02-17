import { DocumentRow } from './DocumentRow';
import { DocumentChunkRow } from './DocumentChunkRow';
import { DocumentChunkAssetRow } from './DocumentChunkAssetRow';
import { UserAssetRow } from './UserAssetRow';
import { UserRow } from './UserRow';
import { ApiKeyRow } from './ApiKeyRow';

export interface Database {
  document: DocumentRow;
  documentchunk: DocumentChunkRow;
  documentchunkasset: DocumentChunkAssetRow;
  userasset: UserAssetRow;
  user: UserRow;
  api_key: ApiKeyRow;
}
