import winston from 'winston';
import { config } from '../config/environment.js';

/**
 * Professional Logging System
 * 
 * Comprehensive logging with multiple transports, structured data,
 * and integration with monitoring services like Sentry
 */

// Custom log levels
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Custom colors for log levels
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(logColors);

// Custom format for structured logging
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf((info) => {
        const { timestamp, level, message, stack, ...meta } = info;

        // Base log object
        const logObject: Record<string, any> = {
            '@timestamp': timestamp,
            level: level.toUpperCase(),
            message,
            environment: config.environment,
        };

        // Add stack trace for errors
        if (stack) {
            logObject.stack = stack;
        }

        // Add metadata
        if (Object.keys(meta).length > 0) {
            logObject.meta = meta;
        }

        return JSON.stringify(logObject);
    })
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => {
        const { timestamp, level, message, stack, ...meta } = info;

        let output = `${timestamp} [${level}]: ${message}`;

        // Add metadata if present
        if (Object.keys(meta).length > 0) {
            output += ` ${JSON.stringify(meta, null, 2)}`;
        }

        // Add stack trace for errors
        if (stack) {
            output += `\n${stack}`;
        }

        return output;
    })
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport for development
if (config.logging.enableConsole || config.isDevelopment) {
    transports.push(
        new winston.transports.Console({
            level: config.logging.level,
            format: config.isDevelopment ? consoleFormat : logFormat,
            handleExceptions: true,
            handleRejections: true,
        })
    );
}

// File transports for production
if (config.logging.enableFile || config.isProduction) {
    // Error log file
    transports.push(
        new winston.transports.File({
            filename: `${config.logging.logDir}/error.log`,
            level: 'error',
            format: logFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            handleExceptions: true,
            handleRejections: true,
        })
    );

    // Combined log file
    transports.push(
        new winston.transports.File({
            filename: `${config.logging.logDir}/combined.log`,
            level: config.logging.level,
            format: logFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );

    // HTTP log file
    transports.push(
        new winston.transports.File({
            filename: `${config.logging.logDir}/http.log`,
            level: 'http',
            format: logFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 3,
        })
    );
}

// Create the logger
export const logger = winston.createLogger({
    level: config.logging.level,
    levels: logLevels,
    format: logFormat,
    transports,
    exitOnError: false,
    silent: config.isTest,
});

// Enhanced logging methods with structured data
export const enhancedLogger = {
    /**
     * Log authentication events
     */
    auth: (message: string, data?: Record<string, any>) => {
        logger.info(message, {
            category: 'authentication',
            ...data,
        });
    },

    /**
     * Log API requests
     */
    request: (message: string, data?: Record<string, any>) => {
        logger.http(message, {
            category: 'api_request',
            ...data,
        });
    },

    /**
     * Log security events
     */
    security: (message: string, data?: Record<string, any>) => {
        logger.warn(message, {
            category: 'security',
            ...data,
        });
    },

    /**
     * Log AI service interactions
     */
    ai: (message: string, data?: Record<string, any>) => {
        logger.info(message, {
            category: 'ai_service',
            ...data,
        });
    },

    /**
     * Log database operations
     */
    database: (message: string, data?: Record<string, any>) => {
        logger.debug(message, {
            category: 'database',
            ...data,
        });
    },

    /**
     * Log file operations
     */
    file: (message: string, data?: Record<string, any>) => {
        logger.info(message, {
            category: 'file_operation',
            ...data,
        });
    },

    /**
     * Log email operations
     */
    email: (message: string, data?: Record<string, any>) => {
        logger.info(message, {
            category: 'email',
            ...data,
        });
    },

    /**
     * Log business logic events
     */
    business: (message: string, data?: Record<string, any>) => {
        logger.info(message, {
            category: 'business_logic',
            ...data,
        });
    },

    /**
     * Log performance metrics
     */
    performance: (message: string, data?: Record<string, any>) => {
        logger.info(message, {
            category: 'performance',
            ...data,
        });
    },

    /**
     * Log error with context
     */
    errorWithContext: (error: Error, context?: Record<string, any>) => {
        logger.error(error.message, {
            category: 'application_error',
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            ...context,
        });
    },
};

// Performance timer utility
export class PerformanceTimer {
    private startTime: number;
    private label: string;

    constructor(label: string) {
        this.label = label;
        this.startTime = Date.now();
    }

    end(additionalData?: Record<string, any>): number {
        const duration = Date.now() - this.startTime;

        enhancedLogger.performance(`${this.label} completed`, {
            duration_ms: duration,
            ...additionalData,
        });

        return duration;
    }
}

// Request correlation utility
export class RequestLogger {
    private correlationId: string;
    private startTime: number;

    constructor(correlationId: string) {
        this.correlationId = correlationId;
        this.startTime = Date.now();
    }

    log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: Record<string, any>) {
        logger[level](message, {
            correlationId: this.correlationId,
            ...data,
        });
    }

    info(message: string, data?: Record<string, any>) {
        this.log('info', message, data);
    }

    warn(message: string, data?: Record<string, any>) {
        this.log('warn', message, data);
    }

    error(message: string, data?: Record<string, any>) {
        this.log('error', message, data);
    }

    debug(message: string, data?: Record<string, any>) {
        this.log('debug', message, data);
    }

    endRequest(statusCode: number, additionalData?: Record<string, any>) {
        const duration = Date.now() - this.startTime;

        enhancedLogger.request('Request completed', {
            correlationId: this.correlationId,
            statusCode,
            duration_ms: duration,
            ...additionalData,
        });
    }
}

// Export default logger for backward compatibility
export default logger;
