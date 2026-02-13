import { DocumentRow } from './DocumentRow';
import { DocumentChunkRow } from './DocumentChunkRow';
import { DocumentChunkAssetRow } from './DocumentChunkAssetRow';
import { UserRow } from './UserRow';
import { ApiKeyRow } from './ApiKeyRow';

export interface Database {
  document: DocumentRow;
  documentchunk: DocumentChunkRow;
  documentchunkasset: DocumentChunkAssetRow;
  user: UserRow;
  api_key: ApiKeyRow;
}
