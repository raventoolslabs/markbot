import { GetGoogleChatAuthUrlQuery } from './get-google-chat-auth-url.query';
import { googleChatService } from '@/app/services/googleChat.service';

export class GetGoogleChatAuthUrlHandler {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async execute(_query: GetGoogleChatAuthUrlQuery): Promise<string> {
        return googleChatService.getAuthUrl();
    }
}
