// Production-ready logging utility
export class Logger {
  private static isDevelopment = process.env.NODE_ENV === 'development';
  private static isProduction = process.env.NODE_ENV === 'production';

  static info(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data || '');
    }
    if (this.isProduction) {
      console.log(`[INFO] ${message}`, data || '');
    }
  }

  static warn(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data || '');
    }
    if (this.isProduction) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }

  static error(message: string, error?: any): void {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error || '');
    }
    if (this.isProduction) {
      console.error(`[ERROR] ${message}`, error || '');
    }
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