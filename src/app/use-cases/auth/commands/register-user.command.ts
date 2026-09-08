export interface RegisterUserCommand {
    email: string;
    password?: string;
    name?: string;
    googleId?: string;
    isGoogleLogin?: boolean;
}
