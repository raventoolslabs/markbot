export class InvalidCredentialsException extends Error {
    constructor() {
        super('Invalid credentials');
        this.name = 'InvalidCredentialsException';
    }
}

export class AccountLockedException extends Error {
    constructor() {
        super('Account is locked. Try again later.');
        this.name = 'AccountLockedException';
    }
}

export class UserAlreadyExistsException extends Error {
    constructor() {
        super('User already exists');
        this.name = 'UserAlreadyExistsException';
    }
}

export class UserNotFoundException extends Error {
    constructor() {
        super('User not found');
        this.name = 'UserNotFoundException';
    }
}

export class InvalidTokenException extends Error {
    constructor() {
        super('Invalid or expired token / code');
        this.name = 'InvalidTokenException';
    }
}
