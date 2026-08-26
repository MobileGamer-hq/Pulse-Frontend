/**
 * Custom Structured Logger for Pulse Frontend
 * Provides timestamped, context-tagged, colorized logging across all UI components, API clients, and catch blocks.
 */

export const logger = {
  info: (context: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`%c[${timestamp}] [INFO] [${context}]`, 'color: #3b82f6; font-weight: bold;', message, data !== undefined ? data : '');
  },

  warn: (context: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.warn(`%c[${timestamp}] [WARN] [${context}]`, 'color: #f59e0b; font-weight: bold;', message, data !== undefined ? data : '');
  },

  error: (context: string, message: string, err?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`%c[${timestamp}] [ERROR] [${context}]`, 'color: #ef4444; font-weight: bold;', message, err !== undefined ? err : '');
  },

  api: (method: string, endpoint: string, status?: number, payload?: any) => {
    const timestamp = new Date().toISOString();
    const color = status && status >= 400 ? 'color: #ef4444;' : 'color: #10b981;';
    console.log(`%c[${timestamp}] [API ${method.toUpperCase()}] ${endpoint} (${status || 'PENDING'})`, color + ' font-weight: bold;', payload !== undefined ? payload : '');
  }
};
