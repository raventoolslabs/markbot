import * as crypto from 'crypto';
import { pipeline } from '@huggingface/transformers';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { logger } from '@/infrastructure/logging/logger';
import { ChunkDto } from '@/api/http/types/ChunkDto';
import { config } from '@/app/config';

/**
 * Configuration interface for VectorUtil
 */
export interface VectorUtilConfig {
    /** Maximum size for each chunk in characters */
    maxChunkSize: number;
    /** Overlap between consecutive chunks in characters */
    chunkOverlap: number;
    /** Hugging Face model name for embeddings */
    modelName: string;
    /** Batch size for processing embeddings */
    batchSize: number;
}

/**
 * Interface for processed document with chunks and extracted assets
 */
export interface ProcessedDocument {
    chunks: ChunkDto[];
    assets: Array<{
        asset_type: 'image' | 'file';
        asset_name: string;
        mime_type: string;
        content: string;
        metadata?: Record<string, any>;
    }>;
}

/**
 * Utility class for processing documents into vector embeddings.
 * Handles chunking of markdown documents and generation of embeddings using Hugging Face models.
 */
export class VectorUtil {
    private readonly config: VectorUtilConfig;
    private extractor: any = null;
    private embeddingCache = new Map<string, number[]>();
    private textSplitter: RecursiveCharacterTextSplitter;

    /**
     * Creates a new VectorUtil instance
     * @param configOverride Optional configuration object. Uses environment variables from config if not provided.
     */
    constructor(configOverride?: Partial<VectorUtilConfig>) {
        this.config = {
            maxChunkSize: configOverride?.maxChunkSize ?? config.vector.maxChunkSize,
            chunkOverlap: configOverride?.chunkOverlap ?? config.vector.chunkOverlap,
            modelName: configOverride?.modelName ?? config.vector.modelName,
            batchSize: configOverride?.batchSize ?? config.vector.batchSize
        };

        // Initialize text splitter with hierarchical separators for better markdown handling
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: this.config.maxChunkSize,
            chunkOverlap: this.config.chunkOverlap,
            separators: ['\n## ', '\n### ', '\n#### ', '\n\n', '\n', ' ', '']
        });
    }

    /**
     * Processes a markdown document: extracts images, chunks text, and generates embeddings.
     * @param markdown The markdown content to process
     * @returns ProcessedDocument with chunks and extracted assets
     * @throws Error if markdown is empty or processing fails
     */
    async processDocument(markdown: string): Promise<ProcessedDocument> {
        const startTime = Date.now();

        // Validation
        if (!markdown || markdown.trim().length === 0) {
            throw new Error('Markdown content cannot be empty');
        }

        try {
            // Extract images first
            const { cleanedMarkdown, images } = this.extractImages(markdown);

            // Process cleaned markdown (without base64 data)
            const chunks = await this.chunkMarkdown(cleanedMarkdown);
            const extractor = await this.getExtractor();

            logger.info(`Generating embeddings for ${chunks.length} chunks in batches of ${this.config.batchSize}...`, 'VectorUtil');

            // Process embeddings in batches for better performance
            for (let i = 0; i < chunks.length; i += this.config.batchSize) {
                const batch = chunks.slice(i, i + this.config.batchSize);

                // Process batch in parallel
                const embeddings = await Promise.all(
                    batch.map(async (chunk) => {
                        // Check cache first
                        const hash = crypto.createHash('sha256').update(chunk.content).digest('hex');
                        if (this.embeddingCache.has(hash)) {
                            logger.debug('Using cached embedding', 'VectorUtil');
                            return this.embeddingCache.get(hash)!;
                        }

                        // Generate new embedding
                        const output = await extractor(chunk.content, { pooling: 'mean', normalize: true });
                        const embedding = Array.from(output.data) as number[];

                        // Cache it
                        this.embeddingCache.set(hash, embedding);
                        return embedding;
                    })
                );

                // Assign embeddings to chunks
                batch.forEach((chunk, idx) => {
                    chunk.embedding = embeddings[idx];
                });
            }

            // Link images to chunks
            const assets = this.linkImagesToChunks(chunks, images);

            const duration = Date.now() - startTime;
            logger.info(
                `Processed ${chunks.length} chunks and ${assets.length} assets in ${duration}ms`,
                'VectorUtil'
            );

            return { chunks, assets };
        } catch (error) {
            logger.error(`Error processing document: ${error}`, 'VectorUtil');
            throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Generate embedding for a single string (e.g. search query)
     * @param text The text to embed
     * @returns Vector embedding as array of numbers
     * @throws Error if text is empty or embedding generation fails
     */
    async embedText(text: string): Promise<number[]> {
        if (!text || text.trim().length === 0) {
            throw new Error('Text cannot be empty');
        }

        try {
            // Check cache first
            const hash = crypto.createHash('sha256').update(text).digest('hex');
            if (this.embeddingCache.has(hash)) {
                logger.debug('Using cached embedding for query', 'VectorUtil');
                return this.embeddingCache.get(hash)!;
            }

            const extractor = await this.getExtractor();
            const output = await extractor(text, { pooling: 'mean', normalize: true });
            const embedding = Array.from(output.data) as number[];

            // Cache it
            this.embeddingCache.set(hash, embedding);
            return embedding;
        } catch (error) {
            logger.error(`Error generating embedding: ${error}`, 'VectorUtil');
            throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Splits markdown text into chunks while preserving section context.
     * Uses LangChain's RecursiveCharacterTextSplitter with markdown-aware separators.
     * @param markdown The markdown content to chunk
     * @returns Array of chunks with metadata
     */
    private async chunkMarkdown(markdown: string): Promise<ChunkDto[]> {
        const chunks: ChunkDto[] = [];

        // Extract section information before splitting
        const sections = this.extractSections(markdown);

        // Split text using LangChain's improved algorithm
        const textChunks = await this.textSplitter.splitText(markdown);

        // Process each chunk and add metadata
        let chunkIndex = 0;
        let currentSearchIndex = 0;
        for (let i = 0; i < textChunks.length; i++) {
            const content = textChunks[i];

            // Skip chunks that only contain a header without content
            if (this.isHeaderOnlyChunk(content)) {
                logger.debug(`Skipping header-only chunk: "${content.substring(0, 50)}..."`, 'VectorUtil');
                continue;
            }

            const hash = crypto.createHash('sha256').update(content).digest('hex');

            // Verify chunk index in original markdown to find correct section
            let chunkStartPos = -1;
            if (currentSearchIndex < markdown.length) {
                chunkStartPos = markdown.indexOf(content, currentSearchIndex);
                if (chunkStartPos !== -1) {
                    // Update search index for next iteration, allowing for overlap
                    // We advance just by 1 to be safe, or we could advance by a heuristic if overlap is known.
                    // Given splitText ensures order, finding from previous match is correct.
                    currentSearchIndex = chunkStartPos;
                }
            }

            // Determine section for this chunk
            const sectionInfo = this.findSectionForChunk(content, sections, chunkStartPos);

            // Use the most specific section title (last element of the path)
            const mostSpecificSection = sectionInfo.path.length > 0
                ? sectionInfo.path[sectionInfo.path.length - 1]
                : sectionInfo.title;

            chunks.push({
                content: content,
                metadata: {
                    section: mostSpecificSection,
                    section_path: sectionInfo.path,
                    chunk: chunkIndex++,
                    page: 1,
                    chunk_size: content.length,
                    content_hash: hash
                }
            });
        }

        return chunks;
    }

    /**
     * Finds the section for a chunk by analyzing headers within the chunk content
     */
    private findSectionForChunk(
        content: string,
        sections: Array<{ title: string; path: string[]; startPos: number; level: number }>,
        chunkStartPos: number
    ): { title: string; path: string[] } {
        // Find all headers within this chunk
        const headerRegex = /^(#{1,6})\s+(.+)$/gm;
        const headersInChunk: Array<{ level: number; title: string }> = [];
        let match;

        while ((match = headerRegex.exec(content)) !== null) {
            const level = match[1].length;
            const rawTitle = match[2];
            const cleanTitle = this.cleanSectionTitle(rawTitle);
            headersInChunk.push({ level, title: cleanTitle });
        }

        // If we found headers in the chunk, use the last one (most specific)
        if (headersInChunk.length > 0) {
            const lastHeader = headersInChunk[headersInChunk.length - 1];

            // Find this header in the sections array to get its full path
            const matchingSection = sections.find(s => s.title === lastHeader.title);
            if (matchingSection) {
                return {
                    title: matchingSection.title,
                    path: matchingSection.path
                };
            }

            // If not found in sections, return just the title
            return {
                title: lastHeader.title,
                path: [lastHeader.title]
            };
        }

        // If no headers in chunk, use position-based detection
        return this.findSectionForPosition(chunkStartPos, sections);
    }

    /**
     * Checks if a chunk only contains a header without any meaningful content
     */
    private isHeaderOnlyChunk(content: string): boolean {
        const lines = content.trim().split('\n').filter(line => line.trim().length > 0);

        // If there's only one line and it's a header, skip it
        if (lines.length === 1) {
            const headerRegex = /^#{1,6}\s+.+$/;
            return headerRegex.test(lines[0]);
        }

        // If all lines are headers (multiple headers without content), skip it
        const headerRegex = /^#{1,6}\s+.+$/;
        const allHeaders = lines.every(line => headerRegex.test(line));

        return allHeaders;
    }

    /**
     * Extracts sections from markdown with their positions and hierarchy
     */
    private extractSections(markdown: string): Array<{ title: string; path: string[]; startPos: number; level: number }> {
        const sections: Array<{ title: string; path: string[]; startPos: number; level: number }> = [];
        const lines = markdown.split('\n');
        const headerRegex = /^(#{1,6})\s+(.+)$/;
        let sectionStack: { level: number; title: string }[] = [];
        let currentPos = 0;

        for (const line of lines) {
            const match = line.match(headerRegex);

            if (match) {
                const level = match[1].length;
                const rawTitle = match[2];
                const cleanTitle = this.cleanSectionTitle(rawTitle);

                // Update stack for hierarchy
                while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].level >= level) {
                    sectionStack.pop();
                }
                sectionStack.push({ level, title: cleanTitle });

                const path = sectionStack.map(s => s.title);
                sections.push({
                    title: cleanTitle,
                    path: [...path],
                    startPos: currentPos,
                    level: level
                });
            }

            currentPos += line.length + 1; // +1 for newline
        }

        return sections;
    }

    /**
     * Finds the section that a chunk at a given position belongs to
     */
    private findSectionForPosition(
        position: number,
        sections: Array<{ title: string; path: string[]; startPos: number; level: number }>
    ): { title: string; path: string[] } {
        // If position is -1 (chunk not found in original), try to find by content match
        if (position === -1) {
            return { title: 'General', path: ['General'] };
        }

        // Find the last section that starts before or at this position
        let currentSection: { title: string; path: string[] } | null = null;

        for (const section of sections) {
            if (section.startPos <= position) {
                currentSection = {
                    title: section.title,
                    path: section.path
                };
            } else {
                // We've passed the chunk position, stop searching
                break;
            }
        }

        // Return the found section or default to 'General'
        return currentSection || { title: 'General', path: ['General'] };
    }

    /**
     * Cleans section titles by removing markdown formatting
     */
    private cleanSectionTitle(title: string): string {
        let clean = title.trim();
        // Remove bold/italics markers
        clean = clean.replace(/\*\*/g, '');
        clean = clean.replace(/__/g, '');
        // Remove backslashes
        clean = clean.replace(/\\/g, '');
        return clean.trim();
    }

    /**
     * Extracts images from markdown content
     * @param markdown The markdown content
     * @returns Object with cleaned markdown and extracted images
     */
    private extractImages(markdown: string): {
        cleanedMarkdown: string;
        images: Map<string, { mimeType: string; data: string }>;
    } {
        const images = new Map<string, { mimeType: string; data: string }>();

        // Regex to match image definitions: [imageName]: <data:image/type;base64,data>
        const imageDefRegex = /\[([^\]]+)\]:\s*<data:image\/([^;]+);base64,([^>]+)>/g;

        let match;
        while ((match = imageDefRegex.exec(markdown)) !== null) {
            const [, imageName, imageType, imageData] = match;
            images.set(imageName, {
                mimeType: `image/${imageType}`,
                data: imageData
            });
        }

        // Remove image definitions from markdown to avoid processing them as text
        const cleanedMarkdown = markdown.replace(imageDefRegex, '');

        logger.info(`Extracted ${images.size} images from markdown`, 'VectorUtil');

        return { cleanedMarkdown, images };
    }

    /**
     * Links extracted images to their corresponding chunks based on image references
     * @param chunks The text chunks
     * @param images Map of extracted images
     * @returns Array of assets with chunk linkage information
     */
    private linkImagesToChunks(
        chunks: ChunkDto[],
        images: Map<string, { mimeType: string; data: string }>
    ): ProcessedDocument['assets'] {
        const assets: ProcessedDocument['assets'] = [];

        // For each chunk, find image references
        chunks.forEach((chunk, index) => {
            const imageRefRegex = /!\[.*?\]\[([^\]]+)\]/g;
            let match;

            while ((match = imageRefRegex.exec(chunk.content)) !== null) {
                const imageName = match[1];
                const imageData = images.get(imageName);

                if (imageData) {
                    // Check if this asset was already added (avoid duplicates)
                    const existingAsset = assets.find(
                        a => a.asset_name === imageName && a.metadata?.chunk_index === index
                    );

                    if (!existingAsset) {
                        assets.push({
                            asset_type: 'image',
                            asset_name: imageName,
                            mime_type: imageData.mimeType,
                            content: imageData.data,
                            metadata: {
                                chunk_index: index,
                                referenced_in_chunk: true
                            }
                        });
                    }
                }
            }
        });

        logger.info(`Linked ${assets.length} assets to chunks`, 'VectorUtil');

        return assets;
    }

    /**
     * Lazy-loads the embedding model
     */
    private async getExtractor() {
        if (!this.extractor) {
            logger.info(`Loading model ${this.config.modelName}...`, 'VectorUtil');
            this.extractor = await pipeline('feature-extraction', this.config.modelName);
            logger.info('Model loaded successfully.', 'VectorUtil');
        }
        return this.extractor;
    }

    /**
     * Releases model resources. Call this when done processing to free memory.
     */
    async dispose(): Promise<void> {
        if (this.extractor) {
            this.extractor = null;
            logger.info('Model resources released.', 'VectorUtil');
        }
    }

    /**
     * Clears the embedding cache to free memory
     */
    clearCache(): void {
        const cacheSize = this.embeddingCache.size;
        this.embeddingCache.clear();
        logger.info(`Cleared embedding cache (${cacheSize} entries).`, 'VectorUtil');
    }

    /**
     * Gets current cache statistics
     */
    getCacheStats(): { size: number; estimatedMemoryMB: number } {
        const size = this.embeddingCache.size;
        // Rough estimate: each embedding is ~384 floats * 8 bytes = ~3KB
        const estimatedMemoryMB = (size * 3) / 1024;
        return { size, estimatedMemoryMB };
    }
}

// Export singleton instance with default configuration
export const vectorUtil = new VectorUtil();