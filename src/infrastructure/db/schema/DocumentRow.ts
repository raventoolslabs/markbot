import { Generated } from 'kysely';

export interface DocumentRow {
  id: string; // uuid
  creation_date: Generated<Date>;
  modification_date: Generated<Date>;
  organization: string;
  path: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any; // Json
}
