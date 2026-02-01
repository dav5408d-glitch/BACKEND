
// Basic logger utility to standardize logs
// In a real production app, this would use 'winston' or 'pino'

export const logger = {
    info: (message: string, meta?: any) => {
        console.log(`[${new Date().toISOString()}] [INFO] ${message}`, meta ? JSON.stringify(meta) : '');
    },
    warn: (message: string, meta?: any) => {
        console.warn(`[${new Date().toISOString()}] [WARN] ${message}`, meta ? JSON.stringify(meta) : '');
    },
    error: (message: string, error?: any) => {
        console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, error);
    },
    debug: (message: string, meta?: any) => {
        // Only log debug if needed or in dev
        if (process.env.NODE_ENV !== 'production' && process.env.DEBUG === 'true') {
            console.debug(`[${new Date().toISOString()}] [DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
        }
    }
};
