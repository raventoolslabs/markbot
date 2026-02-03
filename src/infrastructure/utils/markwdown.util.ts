import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '@/infrastructure/logging/logger';

export class MarkdownUtil {
    /**
     * Saves the markdown content to a persistent location if configured.
     */
    async savePersistedMarkdown(markdown: string, originalFileName?: string): Promise<void> {
        if (process.env.DATA_MARKEDOWN_PATH) {
            try {
                const outputDir = path.resolve(process.env.DATA_MARKEDOWN_PATH);
                await fs.mkdir(outputDir, { recursive: true });

                const baseName = originalFileName ? path.parse(originalFileName).name : `converted_${Date.now()}`;
                const filename = `${baseName}.md`;
                const outputPath = path.join(outputDir, filename);

                await fs.writeFile(outputPath, markdown);
                logger.info(`Saved markdown to: ${outputPath}`, 'MarkdownUtil');
            } catch (persistErr) {
                logger.error(`Failed to persist markdown file: ${persistErr}`, 'MarkdownUtil');
            }
        }
    }
}

export const markdownUtil = new MarkdownUtil();
