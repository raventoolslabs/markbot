import { Generated } from 'kysely';

export interface DocumentChunkRow {
  id: Generated<string>; // BigInt in DB, but treated as string/number generator
  document_id: string;
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any; // Json
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  embedding: any; // vector
}
