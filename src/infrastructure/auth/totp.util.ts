// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { authenticator } = require('@otplib/preset-default');
import * as QRCode from 'qrcode';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { config } from '@/app/config';


// Ensure config has an encryption key, or fallback (WARNING: Fallback is unsafe for prod)
const ENCRYPTION_KEY = config.encryptionKey || '12345678901234567890123456789012'; // Must be 32 chars
const IV_LENGTH = 16;

export class TotpUtil {
    static generateSecret(): string {
        return authenticator.generateSecret();
    }

    static async generateQRCode(secret: string, email: string): Promise<string> {
        const otpauth = authenticator.keyuri(email, config.botName, secret);
        return await QRCode.toDataURL(otpauth);
    }

    static verify(token: string, secret: string): boolean {
        return authenticator.verify({ token, secret });
    }

    static encryptSecret(secret: string): string {
        const iv = randomBytes(IV_LENGTH);
        const cipher = createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(secret, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    }

    static decryptSecret(encryptedSecret: string): string {
        const [ivHex, authTagHex, encryptedHex] = encryptedSecret.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
