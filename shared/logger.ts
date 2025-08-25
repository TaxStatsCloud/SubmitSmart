// Production-ready logging utility
export class Logger {
  private static isDevelopment = process.env.NODE_ENV === 'development';
  private static isProduction = process.env.NODE_ENV === 'production';

  static info(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data || '');
    }
    // In production, this would go to a logging service
  }

  static warn(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data || '');
    }
    // In production, this would go to a logging service
  }

  static error(message: string, error?: any): void {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error || '');
    }
    // In production, this would go to a logging service like Sentry
    // TODO: Implement production error tracking
  }

  static debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
    // Debug logs are never sent to production
  }

  static success(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[SUCCESS] ${message}`, data || '');
    }
  }
}