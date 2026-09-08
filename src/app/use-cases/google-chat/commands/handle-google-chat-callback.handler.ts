import { HandleGoogleChatCallbackCommand } from './handle-google-chat-callback.command';
import { googleChatService } from '@/app/services/googleChat.service';

export class HandleGoogleChatCallbackHandler {
    async execute(command: HandleGoogleChatCallbackCommand): Promise<void> {
        await googleChatService.getToken(command.code);
    }
}
