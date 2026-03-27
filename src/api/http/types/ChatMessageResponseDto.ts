export interface ChatMessageResponseDto {
  text: string; // Markdown-formatted text
  images?: Array<{
    name: string;
    mimeType: string;
    data: string; // base64
  }>;
  cards?: unknown[];
  metadata?: {
    sources?: Array<{ document: string; section: string }>;
    [key: string]: unknown;
  };
}
