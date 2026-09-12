export type ChatPlatform = 'generic';

export interface ChatMessageRequestDto {
  text: string;
  userId?: string;
  userName?: string;
  platform?: ChatPlatform;
}
