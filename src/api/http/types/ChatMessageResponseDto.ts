export interface ChatMessageResponseDto {
    text: string;
    cards?: any[];
    metadata?: Record<string, any>;
}
