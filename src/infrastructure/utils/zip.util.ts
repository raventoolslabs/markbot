import AdmZip from 'adm-zip';
import * as path from 'path';
import * as mime from 'mime-types';
import { logger } from '@/infrastructure/logging/logger';

export class ZipUtil {
  /**
   * Processes a ZIP buffer, extracting markdown files and inlining referenced images.
   * @param buffer ZIP file buffer
   * @returns Array of processed markdown contents with original filenames
   */
  async processZipContent(buffer: Buffer): Promise<Array<{ fileName: string; content: string }>> {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    const markdownFiles: Array<{ fileName: string; content: string }> = [];

    // Map to store all files in zip for easy access: path -> entry
    const fileMap = new Map<string, AdmZip.IZipEntry>();
    zipEntries.forEach((entry) => {
      if (!entry.isDirectory) {
        // Normalize path to use forward slashes and remove leading slash if present
        const normalizedPath = entry.entryName.replace(/\\/g, '/').replace(/^\/+/, '');
        fileMap.set(normalizedPath, entry);
      }
    });

    // Find and process markdown files
    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;

      const entryName = entry.entryName;

      if (entryName.toLowerCase().endsWith('.md')) {
        logger.info(`Processing markdown file from ZIP: ${entryName}`, 'ZipUtil');

        let content = zip.readAsText(entry);
        const processedContent = this.inlineImages(content, entryName, fileMap, zip);

        markdownFiles.push({
          fileName: entryName,
          content: processedContent,
        });
      }
    }

    return markdownFiles;
  }

  /**
   * Replaces valid image paths with base64 data URIs in the format required by VectorUtil.
   */
  private inlineImages(
    markdown: string,
    markdownPath: string,
    fileMap: Map<string, AdmZip.IZipEntry>,
    zip: AdmZip,
  ): string {
    let currentMarkdown = markdown;
    const appendedDefinitions: string[] = [];

    // Regex to match existing image syntax: ![alt](path)
    // We catch the whole tag to replace it if successful
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;

    // We need to replace items. String.replace with callback allows us to handle each match.
    // However, we need to do path resolution which might need the map.

    currentMarkdown = currentMarkdown.replace(imageRegex, (match, altText, imagePath) => {
      // Ignore if already a reference or base64 (though the regex expects (...) so references like [id] won't match here usually)
      if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
        return match;
      }

      // Resolve path
      // markdownPath is like "folder/doc.md"
      // imagePath is like "../img/pic.png" or "./img/pic.png" or "pic.png"
      const markdownDir = path.dirname(markdownPath);
      const resolvedPath = path.posix.join(markdownDir, imagePath);

      // Normalize resolved path (remove leading slash if any, as zip entries usually don't have it locally)
      const normalizedTarget = resolvedPath.replace(/^\/+/, '');

      const imageEntry = fileMap.get(normalizedTarget);

      if (imageEntry) {
        try {
          // Read image data
          const imageBuffer = zip.readFile(imageEntry);
          if (!imageBuffer) return match;

          // Get Mime Type
          const mimeType = mime.lookup(normalizedTarget) || 'image/png';
          const base64Data = imageBuffer.toString('base64');

          // Generate a unique ID for this image reference
          // specific to this file to avoid conflicts if we were merging,
          // but here we are standalone per file.
          // simpler: use the existing filename as ID if unique, or hash.
          // Let's use a sanitized version of the basename + simple hash to be safe and readable
          const safeName = path.basename(normalizedTarget).replace(/[^a-zA-Z0-9-]/g, '_');
          const uniqueId = `${safeName}_${Math.random().toString(36).substr(2, 5)}`;

          // Create the reference definition
          // Format: [imageName]: <data:image/type;base64,data>
          const type = mimeType.replace('image/', '');
          const definition = `[${uniqueId}]: <data:image/${type};base64,${base64Data}>`;

          appendedDefinitions.push(definition);

          // Return the new tag format: ![alt][id]
          return `![${altText}][${uniqueId}]`;
        } catch (err) {
          logger.warn(`Failed to read/process image ${normalizedTarget} in zip: ${err}`, 'ZipUtil');
          return match;
        }
      } else {
        logger.warn(
          `Image file not found in ZIP: ${normalizedTarget} (resolved from ${markdownPath} + ${imagePath})`,
          'ZipUtil',
        );
        return match;
      }
    });

    // Append all definitions to the end of the file
    if (appendedDefinitions.length > 0) {
      currentMarkdown += '\n\n' + appendedDefinitions.join('\n');
    }

    return currentMarkdown;
  }
}

export const zipUtil = new ZipUtil();
