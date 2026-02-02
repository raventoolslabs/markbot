import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { logger } from '../../util/logger';

export class DocumentProcessor {
    /**
     * Converts a PDF buffer to Markdown string using Pandoc (via pdftohtml intermediate step).
     * @param buffer PDF file buffer
     * @param originalFileName Optional original filename for persistence
     */
    async convertPdfToMarkdown(buffer: Buffer, originalFileName?: string): Promise<string> {
        const tempDir = os.tmpdir();
        // Generate a random filename to avoid collisions
        const tempPdfPath = path.join(tempDir, `upload_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`);

        try {
            await fs.writeFile(tempPdfPath, buffer);
            logger.info(`Converting PDF to Markdown via Pandoc pipeline: ${tempPdfPath}`, 'DocumentProcessor');

            let markdown = await this.runPandoc(tempPdfPath);

            // Post-process to fix headers (convert bold text to H2)
            markdown = this.postProcessMarkdown(markdown);

            // Persistence logic
            await this.savePersistedMarkdown(markdown, originalFileName);

            return markdown;
        } catch (error) {
            logger.error(`Error processing PDF: ${error}`, 'DocumentProcessor');
            throw error;
        } finally {
            // Clean up temp file
            try {
                await fs.unlink(tempPdfPath);
            } catch (cleanupErr) {
                logger.warn(`Failed to cleanup temp file ${tempPdfPath}`, 'DocumentProcessor');
            }
        }
    }

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
                logger.info(`Saved markdown to: ${outputPath}`, 'DocumentProcessor');
            } catch (persistErr) {
                logger.error(`Failed to persist markdown file: ${persistErr}`, 'DocumentProcessor');
            }
        }
    }

    private runPandoc(inputPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            // Pipeline: pdftohtml -stdout -i -s -noframes input.pdf | pandoc -f html -t markdown
            // Using 'sh' to handle the pipe easily
            const command = `pdftohtml -stdout -i -s -noframes "${inputPath}" | pandoc -f html -t markdown`;

            const process = spawn('sh', ['-c', command]);

            let output = '';
            let errorOutput = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Conversion failed (code ${code}): ${errorOutput}`));
                } else {
                    resolve(output);
                }
            });

            process.on('error', (err) => {
                reject(new Error(`Failed to spawn conversion process. Are pdftohtml (poppler-utils) and pandoc installed? Details: ${err.message}`));
            });
        });
    }

    private postProcessMarkdown(markdown: string): string {
        let processed = markdown;

        // 1. Cleanup Pandoc noise (Backslashes at end of lines)
        // This is critical as the user reported issues with "\"
        processed = processed.replace(/\\\s*$/gm, '');

        // 2. Cleanup Page/Div markers
        processed = this.cleanupNoise(processed);

        // 3. Normalize whitespace
        processed = processed.replace(/\u00A0/g, ' ');

        // 4. Global Header Strat (Robustness)
        // Strategy A: Headers that are Questions (Starts with ¿)
        // Often found embedded or at start. Convert to H2.
        // We use a safe heuristic: must be inside ** **, start with ¿, length < 300.
        processed = processed.replace(/\*\*(\s*¿[^?]+?\?)\*\*/g, (match, content) => {
            return `\n\n## ${content.trim()}\n\n`;
        });

        // Strategy B: Headers at start of line (even if not questions)
        // Matches: Start of line, optional space, **, content, **, optional remainder
        // We modify the markdown directly.
        // Note: multiple passes might be needed for headers on same line? 
        // With Global Regex replace for questions, we handled the toughest case (Line 35 end).

        const lines = processed.split('\n');
        const processedLines: string[] = [];
        let inBoldBlock = false;
        let boldBuffer: string[] = [];

        // Iterate for remaining bold blocks (multiline)
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const trimmed = line.trim();

            // --- Strategy B continued: Start of line bold (that wasn't caught by Strategy A) ---
            // Example: **Personal**
            // Regex: Start, spaces, **, content, **, (end or spaces)
            const startBoldMatch = /^\s*\*\*(.+?)\*\*(\s*)$/.exec(line);
            if (startBoldMatch && !inBoldBlock) {
                const content = startBoldMatch[1].trim();
                if (content.length < 300 && content.length > 2) {
                    processedLines.push(`## ${content}`);
                    continue;
                }
            }

            // Check for "Sticky" headers at start of line: **Title**Text
            const stickyMatch = /^\s*\*\*(.+?)\*\*(.+)$/.exec(line);
            if (stickyMatch && !inBoldBlock) {
                const content = stickyMatch[1].trim();
                const remainder = stickyMatch[2].trim();
                if (content.length < 300 && content.length > 2) {
                    processedLines.push(`## ${content}`);
                    // The remainder might be text or empty
                    if (remainder) processedLines.push(remainder);
                    continue;
                }
            }

            // --- Multiline Logic ---
            if (inBoldBlock) {
                let endsBlock = /\*\*(\s|\\)*$/.test(trimmed);
                const isClosingLine = /^(\s|\\)*\*\*(\s|\\)*$/.test(trimmed);
                if (isClosingLine) endsBlock = true;

                let content = line;
                if (endsBlock) {
                    content = content.replace(/\*\*(\s|\\)*$/, '');
                    if (isClosingLine) content = '';
                }

                if (content.trim()) boldBuffer.push(content.trim());

                if (endsBlock) {
                    inBoldBlock = false;
                    const fullContent = boldBuffer.join(' ');
                    if (fullContent.length < 300) {
                        processedLines.push(`## ${fullContent}`);
                    } else {
                        processedLines.push(`**${fullContent}**`);
                    }
                    boldBuffer = [];
                }
                continue;
            }

            // Start of multiline bold block
            // Starts with ** but doesn't end with **
            // Since we already handled "Questions inside **" globally, this is for other blocks.
            // We must ensure we don't match something we already converted to ## (Regex replace above modified string)
            // But processedLines is building from 'lines' which comes from 'processed'.
            // So if Strategy A ran, the line is now "## ¿Question?". It doesn't start with **.
            // So safe.

            if (/^\s*\*\*(?!.*?\*\*(?:\s|\\)*$).*/.test(line)) {
                inBoldBlock = true;
                boldBuffer = [];
                let content = line.replace(/^\s*\*\*/, '');
                boldBuffer.push(content.trim());
                continue;
            }

            processedLines.push(line);
        }

        if (inBoldBlock && boldBuffer.length > 0) {
            const fullContent = boldBuffer.join(' ');
            processedLines.push(`## ${fullContent}`);
        }

        return processedLines.join('\n');
    }

    private cleanupNoise(markdown: string): string {
        let cleaned = markdown;

        // Remove Pandoc DIVs for pages (::: {#page1-div ...} ... :::)
        // Note: The closing ::: might be far away, but usually pandoc wraps pages.
        // We can just remove the opening tag line and the closing tag line if they are standalone
        cleaned = cleaned.replace(/^::: \{#page\d+-div[^}]+\}\s*$/gm, '');
        cleaned = cleaned.replace(/^:::\s*$/gm, '');

        // Remove anchors like []{#1} or []{#outline}
        cleaned = cleaned.replace(/^\[\]\{#[^}]+\}\s*$/gm, '');

        // Remove "Document Outline" section at the end if present
        // Looks for "# Document Outline" and removes everything until end or horizontal rule
        const outlineMatch = /# Document Outline[\s\S]*?(?:-{10,}|$)/.exec(cleaned);
        if (outlineMatch) {
            cleaned = cleaned.replace(outlineMatch[0], '');
        }

        return cleaned;
    }
}

export const documentProcessor = new DocumentProcessor();
