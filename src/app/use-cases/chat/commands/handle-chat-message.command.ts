import { ChatMessageRequestDto } from '@/api/http/types/ChatMessageRequestDto';

export interface HandleChatMessageCommand {
    request: ChatMessageRequestDto;
}
