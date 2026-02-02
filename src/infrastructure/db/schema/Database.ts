import { DocumentRow } from './DocumentRow';
import { DocumentChunkRow } from './DocumentChunkRow';

export interface Database {
    document: DocumentRow;
    documentchunk: DocumentChunkRow;
}
