import nodemailer from 'nodemailer';
import { config } from '@/app/config';
import { logger } from '@/infrastructure/logging/logger';

export class EmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.email.host,
            port: config.email.port,
            secure: config.email.port === 465, // true for 465, false for other ports
            auth: {
                user: config.email.user,
                pass: config.email.password,
            },
        });
    }

    async sendVerificationEmail(to: string, code: string) {
        try {
            const info = await this.transporter.sendMail({
                from: config.email.from,
                to,
                subject: 'MarkBot - Verify your email',
                text: `Your verification code is: ${code}`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2>Welcome to MarkBot!</h2>
                        <p>Please use the following code to verify your email address:</p>
                        <h1 style="color: #059669; font-size: 32px; letter-spacing: 5px;">${code}</h1>
                        <p>This code will expire in 15 minutes.</p>
                        <p>If you did not request this, please ignore this email.</p>
                    </div>
                `,
            });
            logger.info(`Verification email sent to ${to} (MessageID: ${info.messageId})`, 'EmailService');
        } catch (error) {
            logger.error('Failed to send verification email', 'EmailService', error);
            throw error; // Rethrow to handle in controller
        }
    }
}

export const emailService = new EmailService();
