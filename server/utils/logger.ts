/**
 * Logger Utility
 * 
 * Provides a consistent logging interface throughout the application
 * with support for different log levels and contexts.
 */

// Log levels in order of severity
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Current environment
const isProduction = process.env.NODE_ENV === 'production';

// Minimum log level based on environment
const minLogLevel: LogLevel = isProduction ? 'info' : 'debug';

// Log level priorities (lower number = higher priority)
const logLevelPriority: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// ANSI color codes for different log levels
const logLevelColors: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m'  // Red
};

// Reset color code
const resetColor = '\x1b[0m';

// Get current timestamp in ISO format
const getTimestamp = (): string => new Date().toISOString();

/**
 * Represents a single logger instance, optionally with context
 */
class Logger {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  /**
   * Log a message at the specified level
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    // Skip logging if level is below minimum
    if (logLevelPriority[level] > logLevelPriority[minLogLevel]) {
      return;
    }

    // Format the log line
    const timestamp = getTimestamp();
    const levelStr = level.toUpperCase().padEnd(5);
    const contextStr = this.context ? ` | ${this.context}` : '';
    
    // Build the formatted log message
    const formattedMessage = `${timestamp} | ${logLevelColors[level]}${levelStr}${resetColor}${contextStr}: ${message}`;
    
    // Output to console
    if (level === 'error') {
      console.error(formattedMessage, ...args);
    } else if (level === 'warn') {
      console.warn(formattedMessage, ...args);
    } else {
      console.log(formattedMessage, ...args);
    }
  }

  /**
   * Create a new logger with the given context
   */
  withContext(context: string): Logger {
    return new Logger(context);
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  /**
   * Log an error message
   */
  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }
}

// Export a singleton instance
export const logger = new Logger();