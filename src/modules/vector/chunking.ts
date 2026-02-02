import * as crypto from 'crypto';

export interface ChunkMetadata {
    source?: string;
    section?: string;
    section_path?: string[];
    page?: number;
    chunk?: number;
    content_hash?: string;
    [key: string]: any;
}

export interface Chunk {
    content: string;
    metadata: ChunkMetadata;
}

export class SemanticChunker {
    // Target size for chunks (in characters)
    private readonly MAX_CHUNK_SIZE = 1000;
    private readonly CHUNK_OVERLAP = 100;

    /**
     * Splits markdown text into chunks based on sections (headers).
     */
    chunkMarkdown(markdown: string): Chunk[] {
        const lines = markdown.split('\n');
        const chunks: Chunk[] = [];

        let currentSectionTitle = 'General';
        // Stack to track section hierarchy: { level: header_level, title: section_title }
        let sectionStack: { level: number, title: string }[] = [];

        let currentBuffer: string[] = [];
        let globalChunkIndex = 0;

        // Regex to match markdown headers (e.g. # Title, ## Subtitle)
        const headerRegex = /^(#{1,6})\s+(.+)$/;

        for (const line of lines) {
            const match = line.match(headerRegex);

            if (match) {
                // We found a new header. Process the accumulated buffer for the previous section.
                if (currentBuffer.length > 0) {
                    const sectionContent = currentBuffer.join('\n').trim();
                    if (sectionContent.length > 0) {
                        // For the content processed here, the section path is the CURRENT stack state
                        const currentPath = sectionStack.length > 0
                            ? sectionStack.map(s => s.title)
                            : [currentSectionTitle];

                        globalChunkIndex = this.processSection(chunks, sectionContent, currentSectionTitle, currentPath, globalChunkIndex);
                    }
                }

                // Parse new header info
                const level = match[1].length;
                const rawTitle = match[2];
                const cleanTitle = this.cleanSectionTitle(rawTitle);

                // Update stack for hierarchy
                // 1. Pop items that are deeper or equal level to current header
                //    (e.g. if we are at level 2, pop any existing level 2, 3, 4...)
                while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].level >= level) {
                    sectionStack.pop();
                }
                // 2. Push new header
                sectionStack.push({ level, title: cleanTitle });

                // Reset buffer and update section title variables
                currentBuffer = [];
                currentSectionTitle = cleanTitle;

                // Should we include the header in the next chunk content? 
                // Usually yes, to maintain context in the text itself.
                currentBuffer.push(line);
            } else {
                currentBuffer.push(line);
            }
        }

        // Process the final section
        if (currentBuffer.length > 0) {
            const sectionContent = currentBuffer.join('\n').trim();
            if (sectionContent.length > 0) {
                const currentPath = sectionStack.length > 0
                    ? sectionStack.map(s => s.title)
                    : [currentSectionTitle];

                this.processSection(chunks, sectionContent, currentSectionTitle, currentPath, globalChunkIndex);
            }
        }

        return chunks;
    }

    /**
     * Takes a single semantic section and splits it into smaller chunks if necessary.
     * Returns the next available chunk index.
     */
    private processSection(chunks: Chunk[], text: string, sectionTitle: string, sectionPath: string[], startIndexOffset: number): number {
        // Check if the section has actual content besides the header
        const hasContent = text.split('\n').some(line => {
            const trimmed = line.trim();
            if (trimmed.length === 0) return false;
            // Ignore headers
            if (/^(#{1,6})\s+(.+)$/.test(trimmed)) return false;
            return true;
        });

        if (!hasContent) {
            return startIndexOffset;
        }

        let chunkIndex = startIndexOffset;

        // Helper to create chunk
        const createChunk = (content: string) => {
            // Calculate SHA256 hash of the content
            const hash = crypto.createHash('sha256').update(content).digest('hex');

            chunks.push({
                content: content,
                metadata: {
                    section: sectionTitle,
                    section_path: sectionPath,
                    chunk: chunkIndex++,
                    page: 1, // Placeholder, can be updated if page info is available
                    content_hash: hash
                }
            });
        };

        // If the text is small enough, add it as a single chunk
        if (text.length <= this.MAX_CHUNK_SIZE) {
            createChunk(text);
            return chunkIndex;
        }

        // Use a simple sliding window or text splitter for larger sections
        let startIndex = 0;

        while (startIndex < text.length) {
            let endIndex = startIndex + this.MAX_CHUNK_SIZE;

            // If we are not at the end of the text, try to find a natural break point (whitespace)
            if (endIndex < text.length) {
                // Look for the last newline or space within the limit to avoid cutting words
                const breakPoint = text.lastIndexOf(' ', endIndex);
                if (breakPoint > startIndex) {
                    endIndex = breakPoint;
                }
            } else {
                endIndex = text.length;
            }

            const chunkContent = text.substring(startIndex, endIndex).trim();
            if (chunkContent.length > 0) {
                createChunk(chunkContent);
            }

            // Move forward...
            let nextStart = endIndex - (endIndex < text.length ? this.CHUNK_OVERLAP : 0);

            // Safety check: ensure we always move forward
            if (nextStart <= startIndex) {
                // If overlap pushes us back to or behind start, force forward to endIndex
                // But we should try to keep some context if possible.
                // For now, let's just ensure progress.
                nextStart = endIndex;
            }

            // Refinement: Ensure nextStart is at a word boundary to avoid cutting words like "Esta" -> "sta"
            // If nextStart falls inside a word, backtrack to the previous space
            if (nextStart > startIndex && nextStart < text.length) {
                // Check if we are in the middle of a word (not space/newline)
                const isWordChar = (char: string) => char !== ' ' && char !== '\n' && char !== '\r' && char !== '\t';

                if (isWordChar(text[nextStart])) {
                    // Backtrack until space or startIndex
                    let tempStart = nextStart;
                    while (tempStart > startIndex && isWordChar(text[tempStart])) {
                        tempStart--;
                    }
                    // If we found a boundary, use it.
                    // If we went all the way back to startIndex, then we have a huge word longer than overlap?
                    // In that case, just stick to original nextStart or force forward.
                    if (tempStart > startIndex) {
                        nextStart = tempStart;
                    }
                }
            }

            // Final check to prevent infinite loops (if backtracking went too far back, though the check > startIndex handles it, verify against loop start)
            if (nextStart <= startIndex) {
                startIndex = endIndex;
            } else {
                startIndex = nextStart;
            }
        }

        return chunkIndex;
    }
    private cleanSectionTitle(title: string): string {
        let clean = title.trim();
        // Remove bold/italics markers
        clean = clean.replace(/\*\*/g, '');
        clean = clean.replace(/__/g, '');
        // Remove single * or _ if used as italics (safeguard)
        // But might act on bullet points if incorrectly matched? Section titles typically don't start with bullet points.
        // Let's stick to ** and __ which are the main offenders reported.

        // Remove characters like backslash
        clean = clean.replace(/\\/g, '');

        return clean.trim();
    }
}

export const semanticChunker = new SemanticChunker();
