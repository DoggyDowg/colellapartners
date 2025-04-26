/* eslint-disable no-console */
// This file is explicitly allowed to use console statements as it's a logging utility

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Define a more specific type for logging arguments
type LogArgs = (string | number | boolean | object | null | undefined)[];

export const logger = {
  debug: (message: string, ...args: LogArgs) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: LogArgs) => {
    if (import.meta.env.DEV) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: LogArgs) => {
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  error: (message: string, error?: unknown, ...args: LogArgs) => {
    // Always log errors, but with environment check
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
    // In production, could send to monitoring service
  },

  // Utility method that uses LogLevel type
  log: (level: LogLevel, message: string, ...args: LogArgs) => {
    switch (level) {
      case 'debug':
        logger.debug(message, ...args);
        break;
      case 'info':
        logger.info(message, ...args);
        break;
      case 'warn':
        logger.warn(message, ...args);
        break;
      case 'error':
        logger.error(message, ...args);
        break;
    }
  }
}; 