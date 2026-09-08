export interface Disable2faCommand {
    userId: string;
    password?: string;
    code?: string;
}
