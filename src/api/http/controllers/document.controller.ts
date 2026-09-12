import { config } from '@/app/config';
import { Document } from '@/domain/entities/Document';
import { DocumentChunk } from '@/domain/entities/DocumentChunk';
import { pergamoDocumentRepository } from '@/infrastructure/pergamo/pergamo-document.repository';

import { UploadDocumentHandler } from '@/app/use-cases/document/commands/upload-document.handler';
import { DeleteDocumentHandler } from '@/app/use-cases/document/commands/delete-document.handler';
import { ListDocumentsHandler } from '@/app/use-cases/document/queries/list-documents.handler';
import { GetDocumentHandler } from '@/app/use-cases/document/queries/get-document.handler';

const uploadDocumentHandler = new UploadDocumentHandler(pergamoDocumentRepository);
const deleteDocumentHandler = new DeleteDocumentHandler(pergamoDocumentRepository);
const listDocumentsHandler = new ListDocumentsHandler(pergamoDocumentRepository);
const getDocumentHandler = new GetDocumentHandler(pergamoDocumentRepository);

// Forma que ya consume web/app/documents.
const toDocumentResponse = (doc: Document) => ({
  id: doc.id,
  path: doc.originalName,
  organization: config.pergamo.organization,
  creationDate: doc.creationDate,
  metadata: doc.metadata,
});

const toChunkResponse = (chunk: DocumentChunk) => ({
  id: chunk.id,
  content: chunk.content,
  metadata: { page: chunk.page, section: chunk.section, chunk_size: chunk.length },
});

export class DocumentController {
  async uploadDocument(buffer: Buffer, originalName: string, mimeType: string) {
    return toDocumentResponse(await uploadDocumentHandler.execute({ buffer, originalName, mimeType }));
  }

  async listDocuments() {
    return (await listDocumentsHandler.execute({})).map(toDocumentResponse);
  }

  async getDocument(id: string) {
    const doc = await getDocumentHandler.execute({ id });
    return doc && { ...toDocumentResponse(doc), chunks: doc.chunks.map(toChunkResponse) };
  }

  async deleteDocument(id: string) {
    await deleteDocumentHandler.execute({ id });
  }
}

export const documentController = new DocumentController();
