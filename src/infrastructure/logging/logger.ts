import { config } from '@/app/config';

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

class Logger {
  private formatMessage(level: LogLevel, message: string, prefix?: string): string {
    const now = new Date();
    const timestamp =
      now.getFullYear() +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(now.getDate()).padStart(2, '0') +
      ' ' +
      String(now.getHours()).padStart(2, '0') +
      ':' +
      String(now.getMinutes()).padStart(2, '0') +
      ':' +
      String(now.getSeconds()).padStart(2, '0');

    const prefixStr = prefix ? ` [${prefix}]` : '';
    return `[${timestamp}] [${level}]${prefixStr} ${message}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(message: any, prefix?: string) {
    console.log(this.formatMessage(LogLevel.INFO, message, prefix));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(message: any, prefix?: string, error?: any) {
    console.warn(this.formatMessage(LogLevel.WARN, message, prefix));

    if (error) {
      console.warn(error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(message: any, prefix?: string, error?: any) {
    console.error(this.formatMessage(LogLevel.ERROR, message, prefix));

    if (error) {
      console.error(error);
    }
  }

  debug(message: string, prefix?: string) {
    if (config.nodeEnv !== 'production') {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, prefix));
    }
  }
}

export const logger = new Logger();
