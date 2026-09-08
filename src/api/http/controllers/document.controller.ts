import { logger } from '@/infrastructure/logging/logger';
import { documentRepository } from '@/infrastructure/db/repositories/document.repository';
import { documentChunkRepository } from '@/infrastructure/db/repositories/document-chunk.repository';
import { documentChunkAssetRepository } from '@/infrastructure/db/repositories/documentchunk-asset.repository';

import { ProcessDocumentHandler } from '@/app/use-cases/document/commands/process-document.handler';
import { DeleteDocumentHandler } from '@/app/use-cases/document/commands/delete-document.handler';
import { SearchDocumentsHandler } from '@/app/use-cases/document/queries/search-documents.handler';
import { ListDocumentsHandler } from '@/app/use-cases/document/queries/list-documents.handler';
import { GetDocumentHandler } from '@/app/use-cases/document/queries/get-document.handler';

const processDocumentHandler = new ProcessDocumentHandler(documentRepository, documentChunkRepository, documentChunkAssetRepository);
const deleteDocumentHandler = new DeleteDocumentHandler(documentRepository);
const searchDocumentsHandler = new SearchDocumentsHandler(documentChunkRepository);
const listDocumentsHandler = new ListDocumentsHandler(documentRepository);
const getDocumentHandler = new GetDocumentHandler(documentRepository, documentChunkRepository);

export class DocumentController {
  constructor() { }

  async processFile(buffer: Buffer, originalName: string, mimeType: string) {
    try {
      const result = await processDocumentHandler.execute({ buffer, originalName, mimeType });
      return result;
    } catch (error) {
      logger.error(`Error processing file ${originalName}: ${error}`, 'DocumentController');
      throw error;
    }
  }

  async search(query: string, limit: number = 5) {
    try {
      return await searchDocumentsHandler.execute({ query, limit });
    } catch (error) {
      logger.error(`Error searching: ${error}`, 'DocumentController');
      throw error;
    }
  }

  async listDocuments() {
    try {
      return await listDocumentsHandler.execute({});
    } catch (error) {
      logger.error(`Error listing documents: ${error}`, 'DocumentController');
      throw error;
    }
  }

  async getDocument(id: string) {
    try {
      return await getDocumentHandler.execute({ id });
    } catch (error) {
      logger.error(`Error getting document ${id}: ${error}`, 'DocumentController');
      throw error;
    }
  }

  async deleteDocument(id: string) {
    try {
      await deleteDocumentHandler.execute({ id });
    } catch (error) {
      logger.error(`Error deleting document ${id}: ${error}`, 'DocumentController');
      throw error;
    }
  }
}

export const documentController = new DocumentController();
