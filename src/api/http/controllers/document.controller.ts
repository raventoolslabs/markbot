
import { logger } from '@/infrastructure/logging/logger';
import { documentService } from '@/app/services/document.service';

export class DocumentController {
  constructor() { }

  async processFile(buffer: Buffer, originalName: string, mimeType: string) {
    try {
      const result = await documentService.processFile(buffer, originalName, mimeType);
      return result;
    } catch (error) {
      logger.error(`Error processing file ${originalName}: ${error}`, 'DocumentController');
      throw error;
    }
  }

  async search(query: string, limit: number = 5) {
    try {
      return await documentService.search(query, limit);
    } catch (error) {
      logger.error(`Error searching: ${error}`, 'DocumentController');
      throw error;
    }
  }

  async listDocuments() {
    try {
      return await documentService.listDocuments();
    } catch (error) {
      logger.error(`Error listing documents: ${error}`, 'DocumentController');
      throw error;
    }
  }

  async getDocument(id: string) {
    try {
      return await documentService.getDocument(id);
    } catch (error) {
      logger.error(`Error getting document ${id}: ${error}`, 'DocumentController');
      throw error;
    }
  }

  async deleteDocument(id: string) {
    try {
      await documentService.deleteDocument(id);
    } catch (error) {
      logger.error(`Error deleting document ${id}: ${error}`, 'DocumentController');
      throw error;
    }
  }
}

export const documentController = new DocumentController();
