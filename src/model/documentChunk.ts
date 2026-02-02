import { Generated } from 'kysely';

export interface DocumentChunkTable {
    id: Generated<string>; // BigInt in DB, but treated as string/number generator
    document_id: string;
    content: string;
    metadata: any; // Json
    embedding: any; // vector
}
