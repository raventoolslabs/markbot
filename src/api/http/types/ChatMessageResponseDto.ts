export interface ChatMessageResponseDto {
  text: string; // Markdown-formatted text
  images?: Array<{
    name: string;
    mimeType: string;
    data: string; // base64
  }>;
  cards?: unknown[];
  metadata?: Record<string, unknown>;
}
