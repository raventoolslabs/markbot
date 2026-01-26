import { config } from '../config';

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

  info(message: string, prefix?: string) {
    console.log(this.formatMessage(LogLevel.INFO, message, prefix));
  }

  warn(message: string, prefix?: string) {
    console.warn(this.formatMessage(LogLevel.WARN, message, prefix));
  }

  error(message: string, prefix?: string, error?: any) {
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
