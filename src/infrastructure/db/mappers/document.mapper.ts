import { Document } from '@/domain/entities/Document';
import { DocumentRow } from '../schema/DocumentRow';

export const mapDocumentRowToDocument = (row: any): Document => ({
    id: row.id,
    creationDate: row.creation_date as Date,
    modificationDate: row.modification_date as Date,
    organization: row.organization,
    path: row.path,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
});

export const mapDocumentToDocumentRow = (entity: Document): any => ({
    id: entity.id,
    creation_date: entity.creationDate,
    modification_date: entity.modificationDate,
    organization: entity.organization,
    path: entity.path,
    metadata: typeof entity.metadata === 'string' ? entity.metadata : JSON.stringify(entity.metadata || {}),
});
