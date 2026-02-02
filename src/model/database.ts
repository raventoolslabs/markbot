import { DocumentTable } from './document';
import { DocumentChunkTable } from './documentChunk';

export interface Database {
    document: DocumentTable;
    documentchunk: DocumentChunkTable;
}
