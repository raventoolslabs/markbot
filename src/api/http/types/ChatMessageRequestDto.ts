export type ChatPlatform = 'google' | 'generic';

export interface ChatMessageRequestDto {
  text: string;
  userId?: string;
  userName?: string;
  spaceId?: string;
  platform?: ChatPlatform;
}
