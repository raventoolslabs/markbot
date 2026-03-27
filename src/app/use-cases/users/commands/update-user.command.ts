export interface UpdateUserCommand {
    targetUserId: string;
    requestingUserEmail: string;
    name?: string;
    file?: { buffer: Buffer; mimetype: string };
}
